"""Rules of the census elements (§3.4 of 04-modello-dati.md; EL-1, EL-3, EL-5, EL-7,
EL-8)."""

from decimal import Decimal

from catalogs.attributes import validate_attributes
from catalogs.models import ElementClass
from catalogs.services import check_available
from core import geo
from core.enums import GeometryType
from core.errors import api_error, check_revision, validate_model
from core.models import ChangeRecord
from core.services import (
    json_value,
    lock_for_change,
    record_change,
    save_validated,
    snapshot,
    stamp,
)
from django.db import transaction
from django.db.models.deletion import ProtectedError, RestrictedError
from django.utils import timezone
from parties.services import next_sequence_value
from rest_framework import serializers
from territory.models import Area
from territory.services import stored_id

from .models import CompositionItem, Element

Operation = ChangeRecord.Operation
SpeciesMode = ElementClass.SpeciesMode

# Counter of the element codes of a client (parties.ClientSequence).
CODE_SEQUENCE = "element"
MAX_PERCENTAGE = Decimal(100)


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
    assets of a client are separate from the others (scenario 4.8).
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
    element.client = area.client
    return area


def apply_geometry(element):
    """The geometry of the type of the class, and its length or surface."""
    if element.geometry is None:
        return
    geometry_type = element.element_class.geometry_type
    try:
        element.geometry = geo.normalize(element.geometry, geometry_type)
    except geo.GeometryError as exc:
        raise serializers.ValidationError({"geometry": exc.payload})
    measures = geo.geodesic_measures(element.geometry)
    element.length_m = (
        measures["length_m"] if geometry_type == GeometryType.LINE else None
    )
    element.surface_m2 = (
        measures["area_m2"] if geometry_type == GeometryType.POLYGON else None
    )


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
    Removal and restoration (EL-7): the cause of a removal is available and,
    for the classes that count as trees, required. An element restored must not
    have been replaced by a present element.
    """
    if element.removed_on is not None:
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
      and the geometry is of its type, with its length or surface;
    - species and composition as the class asks, the attributes of the class
      (``validate_attributes``) when ``check_attributes``;
    - the element it replaces, removal and restoration.

    ``composition`` is the new composition (``species``, ``quantity``,
    ``percentage``), ``None`` if it does not change. The code of a new element is
    given when it is saved (``commit_element``).
    """
    area = check_area(element, context, before)
    organization = area.client.managing_organization
    check_available(
        element.element_class,
        organization,
        field="element_class",
        previous_id=stored_id(before, "element_class"),
    )
    apply_geometry(element)
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
    """Delete an element entered by mistake, with a cancellation in the history.
    An element that is no longer there is removed instead (``remove_element``)."""
    element = lock_element(element, context)
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
