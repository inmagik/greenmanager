"""Rules of the census elements (§3.4 of 04-modello-dati.md; EL-1, EL-3, EL-5, EL-7,
EL-8, EL-10, AR-5)."""

from decimal import Decimal

from catalogs.attributes import validate_attributes
from catalogs.models import ElementClass
from catalogs.services import check_available
from core import geo
from core.enums import GeometryType
from core.errors import api_error, check_revision, error_payload, validate_model
from core.models import ChangeRecord
from core.services import (
    json_value,
    lock_for_change,
    record_change,
    save_validated,
    snapshot,
    stamp,
)
from django.contrib.gis.db.models.functions import Intersection, PointOnSurface
from django.contrib.gis.geos import MultiLineString, Point
from django.db import transaction
from django.db.models.deletion import ProtectedError, RestrictedError
from django.utils import timezone
from parties.models import Client
from parties.services import next_sequence_value
from rest_framework import serializers
from territory.models import Area
from territory.services import check_client_active, stored_id

from .models import CompositionItem, Element, code_order

Operation = ChangeRecord.Operation
SpeciesMode = ElementClass.SpeciesMode
LocationSource = Element.LocationSource
LocationStatus = Element.LocationStatus

# Counter of the element codes of a client (parties.ClientSequence).
CODE_SEQUENCE = "element"
MAX_PERCENTAGE = Decimal(100)
# A new tree within this distance of a present tree, inclusive, may be the same
# tree, surveyed twice (scenario 4.2, D-052): meters on the ellipsoid.
NEAR_TREE_DISTANCE_M = 2


def element_snapshot(element):
    """Values of a saved element for the history, with its composition."""
    values = snapshot(element)
    values["composition"] = sorted(
        (
            {
                "species": json_value(item.species_id),
                "quantity": item.quantity,
                "percentage": json_value(item.percentage),
            }
            for item in element.composition.all()
        ),
        key=lambda item: item["species"],
    )
    return values


def check_area(element, context, before=None):
    """
    The area of the element, which the organization of the change must be able
    to edit. It gives the client of the element, which does not change: the
    assets of a client are separate from the others (scenario 4.8). A new
    element needs an active client.
    """
    area = (
        Area.objects.editable_by(context.organization)
        .select_related("client__managing_organization")
        .defer("geometry")
        .filter(pk=element.area_id)
        .first()
    )
    if area is None:
        raise api_error(
            "area_not_available", "The area is not available.", field="area"
        )
    if before is not None and area.client_id != stored_id(before, "client"):
        raise api_error(
            "area_of_another_client",
            "The area belongs to another client: an element does not change client.",
            field="area",
        )
    if before is None:
        check_client_active(area.client, field="area")
    element.client = area.client
    return area


def normalized_geometry(geometry, element_class):
    """The geometry as stored for the type of the class, or an API error."""
    try:
        return geo.normalize(geometry, element_class.geometry_type)
    except geo.GeometryError as exc:
        raise serializers.ValidationError({"geometry": exc.payload})


def geometry_measures(geometry, geometry_type):
    """The length of a line or the surface of a polygon, on the ellipsoid."""
    measures = geo.geodesic_measures(geometry)
    return {
        "length_m": (
            measures["length_m"] if geometry_type == GeometryType.LINE else None
        ),
        "surface_m2": (
            measures["area_m2"] if geometry_type == GeometryType.POLYGON else None
        ),
    }


def place_at_area_center(element):
    """
    Position at the center of the area (EL-10): with ``location_source``
    ``area_center`` the point is on the surface of the area of the element
    (``ST_PointOnSurface``), computed again at each save, and the position is
    provisional. To place the element elsewhere, the source changes too (e.g.
    to ``gps`` or ``map``): until then a geometry or a verified status sent do
    not count.
    """
    if element.location_source != LocationSource.AREA_CENTER:
        return
    if element.element_class.geometry_type != GeometryType.POINT:
        raise api_error(
            "area_center_point_only",
            "Only an element with a point can be placed at the center of its area.",
            field="location_source",
        )
    element.geometry = (
        Area.objects.filter(pk=element.area_id)
        .annotate(center=PointOnSurface("geometry"))
        .values_list("center", flat=True)
        .get()
    )
    element.location_status = LocationStatus.PROVISIONAL


def apply_geometry(element):
    """The geometry of the type of the class, and its length or surface."""
    if element.geometry is None:
        raise api_error(
            "geometry_required",
            "The geometry is required, unless the element is placed at the center "
            "of its area.",
            field="geometry",
        )
    element.geometry = normalized_geometry(element.geometry, element.element_class)
    measures = geometry_measures(element.geometry, element.element_class.geometry_type)
    element.length_m = measures["length_m"]
    element.surface_m2 = measures["surface_m2"]


def check_location(element, before=None):
    """
    The verification of a provisional position is a survey in the field (§3.4
    of 04-modello-dati.md): it gives the date of the survey, today, unless the
    change sets another one.
    """
    if (
        before is not None
        and before.get("location_status") == LocationStatus.PROVISIONAL
        and element.location_status == LocationStatus.VERIFIED
        and json_value(element.surveyed_on) == before.get("surveyed_on")
    ):
        element.surveyed_on = timezone.localdate()


def check_composition(element, items, organization):
    """
    The new composition of an element (EL-5): each species once, with its
    quantity or percentage, and the percentages up to 100. A new species must be
    available; one already in the composition stays even if hidden or retired.
    """
    stored = (
        set(element.composition.values_list("species_id", flat=True))
        if not element._state.adding
        else set()
    )
    species_ids = [item["species"].pk for item in items]
    if len(set(species_ids)) != len(species_ids):
        raise api_error(
            "composition_species_duplicated",
            "The species is already in the composition.",
            field="composition",
        )
    total = Decimal(0)
    for item in items:
        species = item["species"]
        if item.get("quantity") is None and item.get("percentage") is None:
            raise api_error(
                "composition_quantity_required",
                "Each species has a quantity or a percentage.",
                {"species": species.name},
                field="composition",
            )
        total += item.get("percentage") or 0
        if species.pk not in stored:
            check_available(species, organization, field="composition")
    if total > MAX_PERCENTAGE:
        raise api_error(
            "composition_percentage_over_100",
            "The percentages add up to more than 100.",
            {"total": total},
            field="composition",
        )


def check_species(element, organization, before=None, composition=None):
    """
    Species and composition as the class asks (``species_mode``): a single
    species, a composition, either of the two, or none (e.g. the furniture).
    ``composition`` is the new composition, ``None`` if it does not change.
    """
    mode = element.element_class.species_mode
    if composition is not None:
        has_composition = bool(composition)
    else:
        has_composition = not element._state.adding and element.composition.exists()
    if element.species_id is not None and mode in (
        SpeciesMode.NONE,
        SpeciesMode.COMPOSITION,
    ):
        raise api_error(
            "species_not_allowed",
            "The class of the element has no single species.",
            field="species",
        )
    if element.species_id is None and mode == SpeciesMode.SINGLE:
        raise api_error(
            "species_required",
            "The class of the element needs a species.",
            field="species",
        )
    if has_composition and mode in (SpeciesMode.NONE, SpeciesMode.SINGLE):
        raise api_error(
            "composition_not_allowed",
            "The class of the element has no composition.",
            field="composition",
        )
    if has_composition and element.species_id is not None:
        raise api_error(
            "species_and_composition",
            "An element has a species or a composition, not both.",
            field="species",
        )
    check_available(
        element.species,
        organization,
        field="species",
        previous_id=stored_id(before, "species"),
    )
    if composition is not None:
        check_composition(element, composition, organization)


def check_replaced(element, before=None):
    """
    The element that the element replaces (D-029): of the same client, already
    removed, and not in a chain of replacements that comes back to the element.

    The replaced element is locked, so that it is not restored meanwhile
    (``restore_element``).
    """
    if element.replaces_id is None or element.replaces_id == stored_id(
        before, "replaces"
    ):
        return
    replaced = (
        Element.objects.select_for_update(no_key=True)
        .filter(pk=element.replaces_id, client_id=element.client_id)
        .only("removed_on", "replaces_id")
        .first()
    )
    if replaced is None:
        raise api_error(
            "replaced_element_not_available",
            "The replaced element is not an element of the client.",
            field="replaces",
        )
    if replaced.removed_on is None:
        raise api_error(
            "replaced_element_not_removed",
            "The replaced element must be removed first.",
            field="replaces",
        )
    seen = set()
    current = replaced
    while current is not None:
        if current.pk == element.pk or current.pk in seen:
            raise api_error(
                "replacement_cycle",
                "The replacements would come back to the element.",
                field="replaces",
            )
        seen.add(current.pk)
        if current.replaces_id is None:
            break
        current = (
            Element.objects.only("replaces_id").filter(pk=current.replaces_id).first()
        )


def check_life_cycle(element, organization, before=None):
    """
    Removal and restoration (EL-7): a removal has already happened, its cause is
    available and, for the classes that count as trees, required. An element
    restored must not have been replaced by a present element.

    A removal still to be made is an intervention to plan: with the date not in
    the future, the elements present today are those without ``removed_on``,
    as the constraint of the tag number assumes.
    """
    if element.removed_on is not None:
        if element.removed_on > timezone.localdate():
            raise api_error(
                "removal_date_in_future",
                "The removal date cannot be in the future.",
                field="removed_on",
            )
        check_available(
            element.removal_cause,
            organization,
            field="removal_cause",
            previous_id=stored_id(before, "removal_cause"),
        )
        if element.removal_cause_id is None and element.element_class.counts_as_tree:
            raise api_error(
                "removal_cause_required",
                "The cause is required for the removal of a tree.",
                field="removal_cause",
            )
    elif (before or {}).get("removed_on") and element.replaced_by.filter(
        removed_on__isnull=True
    ).exists():
        raise api_error(
            "element_replaced",
            "Another element takes its place: it cannot be restored.",
            field="removed_on",
        )


def prepare_element(
    element, context, before=None, composition=None, check_attributes=True
):
    """
    Rules and derived values of an element, before saving:
    - the area gives the client, which does not change;
    - the class is available to the managing organization of the client (D-027),
      and the geometry is of its type, with its length or surface; at the center
      of the area, the server gives it (EL-10);
    - the verification of a provisional position gives the date of the survey;
    - species and composition as the class asks, the attributes of the class
      (``validate_attributes``) when ``check_attributes``;
    - the element it replaces, removal and restoration.

    ``composition`` is the new composition (``species``, ``quantity``,
    ``percentage``), ``None`` if it does not change. The code of a new element is
    given when it is saved (``commit_element``). The spatial checks are warnings
    (``element_warnings``): they do not block the save.
    """
    area = check_area(element, context, before)
    organization = area.client.managing_organization
    check_available(
        element.element_class,
        organization,
        field="element_class",
        previous_id=stored_id(before, "element_class"),
    )
    place_at_area_center(element)
    apply_geometry(element)
    check_location(element, before)
    check_species(element, organization, before, composition)
    if check_attributes:
        element.attributes = validate_attributes(
            element.element_class,
            element.attributes,
            previous=(before or {}).get("attributes"),
        )
    element.tag_number = element.tag_number.strip()
    check_replaced(element, before)
    check_life_cycle(element, organization, before)
    if element._state.adding and element.surveyed_on is None:
        element.surveyed_on = timezone.localdate()
    validate_model(element, exclude=["code"] if element._state.adding else None)


def save_composition(element, items, context):
    """Replace the composition of a saved element with ``items``."""
    stored = {item.species_id: item for item in element.composition.all()}
    selected = {item["species"].pk for item in items}
    for species_id, item in stored.items():
        if species_id not in selected:
            item.delete()
    for data in items:
        item = stored.get(data["species"].pk) or CompositionItem(
            element=element, species=data["species"]
        )
        quantity, percentage = data.get("quantity"), data.get("percentage")
        if (
            not item._state.adding
            and item.quantity == quantity
            and item.percentage == percentage
        ):
            continue
        item.quantity, item.percentage = quantity, percentage
        stamp(item, context.actor)
        item.save()


def commit_element(element, context, before=None, composition=None, reason=""):
    """Save a prepared element, its composition and its history. A new element
    gets the next code of its client, never given before (EL-8)."""
    if element._state.adding and not element.code:
        element.code = str(next_sequence_value(element.client_id, CODE_SEQUENCE))
    stamp(element, context.actor)
    save_validated(element)
    if composition is not None:
        save_composition(element, composition, context)
    record_change(
        instance=element,
        operation=Operation.CREATE if before is None else Operation.UPDATE,
        context=context,
        before=before,
        after=element_snapshot(element),
        reason=reason,
    )
    return element


def lock_element(element, context):
    """The element, locked, if the organization of the change can still edit it."""
    return lock_for_change(
        Element.objects.editable_by(context.organization), element.pk
    )


@transaction.atomic
def create_element(data, context):
    data = dict(data)
    composition = data.pop("composition", None)
    element = Element(**data)
    prepare_element(element, context, composition=composition)
    return commit_element(element, context, composition=composition)


@transaction.atomic
def update_element(element, data, context, expected_revision=None):
    """Change an element. The attributes are checked when they or the class
    change: a change of other data does not depend on the attributes."""
    element = lock_element(element, context)
    check_revision(element, expected_revision)
    before = element_snapshot(element)
    data = dict(data)
    composition = data.pop("composition", None)
    for field, value in data.items():
        setattr(element, field, value)
    check_attributes = "attributes" in data or element.element_class_id != stored_id(
        before, "element_class"
    )
    prepare_element(element, context, before, composition, check_attributes)
    return commit_element(element, context, before, composition)


@transaction.atomic
def remove_element(element, data, context, expected_revision=None):
    """
    Remove an element on ``removed_on``, with ``removal_cause`` (EL-7). It stays
    in the history and in the assets at the dates before. On an element already
    removed, it corrects date and cause.
    """
    element = lock_element(element, context)
    check_revision(element, expected_revision)
    before = element_snapshot(element)
    element.removed_on = data["removed_on"]
    element.removal_cause = data.get("removal_cause")
    prepare_element(element, context, before, check_attributes=False)
    return commit_element(element, context, before, reason=data.get("reason", ""))


@transaction.atomic
def restore_element(element, data, context, expected_revision=None):
    """Restore an element removed by mistake: without date and cause of the
    removal."""
    element = lock_element(element, context)
    check_revision(element, expected_revision)
    if element.removed_on is None:
        raise api_error("element_not_removed", "The element is not removed.")
    before = element_snapshot(element)
    element.removed_on = None
    element.removal_cause = None
    prepare_element(element, context, before, check_attributes=False)
    return commit_element(element, context, before, reason=data.get("reason", ""))


@transaction.atomic
def delete_element(element, context):
    """
    Delete an element entered by mistake, with a cancellation in the history.
    An element that is no longer there is removed instead (``remove_element``),
    and a removed element stays in the history: its removal can be corrected or
    undone (``restore_element``), not deleted.
    """
    element = lock_element(element, context)
    if element.removed_on is not None:
        raise api_error(
            "element_already_removed",
            "A removed element stays in the history: correct its removal instead.",
            {"code": element.code},
        )
    record_id = element.pk
    before = element_snapshot(element)
    try:
        with transaction.atomic():
            element.delete()
    except (ProtectedError, RestrictedError):
        raise api_error(
            "element_has_related_data",
            "The element has related data: remove it instead.",
            {"code": element.code},
        )
    element.pk = record_id
    record_change(
        instance=element, operation=Operation.CANCEL, context=context, before=before
    )


# Spatial checks (AR-5, scenario 4.2): warnings, which do not block the save.


def suggest_area(geometry, areas):
    """
    The area proposed for the position of an element (scenario 4.2): among
    ``areas`` managed today, the one that contains the point, or most of the
    line or the polygon, on the ellipsoid. Between areas alike, the smallest
    one. ``None`` if no area has a part of it.
    """
    areas = areas.managed_on(timezone.localdate()).filter(geometry__intersects=geometry)
    order = ("surface_m2", "number", "sub_number")
    if isinstance(geometry, Point):
        return areas.order_by(*order).first()
    function = "ST_Length" if isinstance(geometry, MultiLineString) else "ST_Area"
    return (
        areas.annotate(
            shared=geo.geodesic(function, Intersection("geometry", geometry))
        )
        .filter(shared__gt=0)
        .order_by("-shared", *order)
        .first()
    )


def outside_area_warnings(geometry, area):
    """The perimeter of the area does not cover the geometry (AR-5)."""
    if (
        area is None
        or Area.objects.filter(pk=area.pk, geometry__covers=geometry).exists()
    ):
        return []
    return [
        error_payload(
            "element_outside_area",
            "The element is outside its area.",
            {"area": str(area)},
        )
    ]


def near_tree_warnings(elements, element_class, geometry, exclude=None):
    """
    A tree within ``NEAR_TREE_DISTANCE_M`` of a present tree among ``elements``,
    inclusive: it may be the same tree, surveyed twice (scenario 4.2, D-052).
    Provisional positions do not count: they were not surveyed (EL-10).
    """
    if not element_class.counts_as_tree or not isinstance(geometry, Point):
        return []
    trees = elements.filter(
        removed_on__isnull=True,
        element_class__counts_as_tree=True,
        location_status=LocationStatus.VERIFIED,
    ).near(geometry, NEAR_TREE_DISTANCE_M)
    if exclude is not None:
        trees = trees.exclude(pk=exclude)
    codes = list(trees.order_by(*code_order()).values_list("code", flat=True))
    if not codes:
        return []
    return [
        error_payload(
            "element_near_tree",
            "A present tree is very close: it may be the same tree.",
            {"elements": ", ".join(codes), "distance": NEAR_TREE_DISTANCE_M},
        )
    ]


def element_warnings(element, new_position=False):
    """
    The warnings of a saved element: outside its area and, when a present tree
    gets a new surveyed position (``new_position``: creation, a new geometry or
    class), near other trees. Two trees close together stay as the surveyor
    saved them: the detail does not report them again.
    """
    warnings = outside_area_warnings(element.geometry, element.area)
    if (
        new_position
        and element.removed_on is None
        and element.location_status == LocationStatus.VERIFIED
    ):
        warnings += near_tree_warnings(
            Element.objects.filter(client_id=element.client_id),
            element.element_class,
            element.geometry,
            exclude=element.pk,
        )
    return warnings


def check_element_geometry(
    element_class, geometry, context, area_id=None, client_id=None, element=None
):
    """
    Measures, proposed area and warnings of the position of an element, before
    saving it (AR-5, scenario 4.2).

    ``element`` is the element being changed: it gives the client and, if the
    form sends none, the area, and it stays out of the near trees. ``area`` is
    the area chosen in the form; ``client`` limits the proposal to the areas of
    a client, otherwise it is among the areas the organization can edit. The
    warnings are about the chosen area or, without one, the proposed one; the
    near trees are those of its client, and without area or client there are
    none to compare.
    """
    organization = context.organization
    if element is not None:
        client_id = element.client_id
        area_id = area_id or element.area_id
    areas = (
        Area.objects.editable_by(organization)
        .select_related("client__managing_organization")
        .defer("geometry")
    )
    client = None
    if client_id is not None:
        client = Client.objects.editable_by(organization).filter(pk=client_id).first()
        if client is None:
            raise api_error(
                "client_not_available", "The client is not available.", field="client"
            )
        areas = areas.filter(client=client)
    area = None
    if area_id is not None:
        area = areas.filter(pk=area_id).first()
        if area is None:
            raise api_error(
                "area_not_available", "The area is not available.", field="area"
            )
        client = area.client
    check_available(
        element_class,
        client.managing_organization if client is not None else organization,
        field="element_class",
        previous_id=element.element_class_id if element is not None else None,
    )
    geometry = normalized_geometry(geometry, element_class)
    suggested = suggest_area(geometry, areas)
    target = area or suggested
    if target is not None:
        client = target.client
    warnings = outside_area_warnings(geometry, target)
    if client is not None and (element is None or element.removed_on is None):
        warnings += near_tree_warnings(
            Element.objects.filter(client=client),
            element_class,
            geometry,
            exclude=element.pk if element is not None else None,
        )
    return {
        **geometry_measures(geometry, element_class.geometry_type),
        "suggested_area": suggested,
        "warnings": warnings,
    }
