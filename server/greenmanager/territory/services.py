"""Rules of the zones and the areas (D-019, AR-1, AR-3, AR-5)."""

import uuid

from catalogs.services import check_available
from core import geo
from core.enums import GeometryType
from core.errors import api_error, check_revision, error_payload, validate_model
from core.models import ChangeRecord
from core.services import (
    lock_for_change,
    record_change,
    save_validated,
    snapshot,
    stamp,
)
from django.db import transaction
from django.db.models import Max
from django.db.models.deletion import ProtectedError, RestrictedError
from django.utils import timezone
from parties.models import Client
from rest_framework import serializers

from .models import Area, Zone

Operation = ChangeRecord.Operation

# Classifications of an area: catalogs the managing organization picks from.
AREA_CLASSIFICATIONS = ("urban_green_type", "area_use", "usage_intensity")


def stored_id(before, field):
    """The key of a relation in a snapshot (``core.services.snapshot``)."""
    value = (before or {}).get(field)
    return uuid.UUID(value) if value else None


def check_client(record, context, before=None):
    """
    The client of a zone or an area, which the organization of the change must
    be able to edit. It does not change after the creation: the assets of a
    client are separate from the others (scenario 4.8). A deactivated client
    gets no new records; those it has can still change.

    A new record locks the client until the end of the transaction, without
    blocking the records that refer to it (``FOR NO KEY UPDATE``): the client is
    not deactivated meanwhile, and two new zones do not get the same code.
    """
    if before is not None and record.client_id != stored_id(before, "client"):
        raise api_error("client_immutable", "The client cannot change.", field="client")
    clients = Client.objects.editable_by(context.organization)
    if before is None:
        clients = clients.select_for_update(no_key=True, of=("self",))
    client = clients.filter(pk=record.client_id).first()
    if client is None:
        raise api_error(
            "client_not_available", "The client is not available.", field="client"
        )
    if before is None:
        check_client_active(client, field="client")
    return client


def check_client_active(client, field):
    """A deactivated client gets no new zones, areas or elements: it is
    reactivated first."""
    if not client.active:
        raise api_error(
            "client_inactive",
            "The client is deactivated: it gets no new data.",
            {"name": client.name},
            field=field,
        )


def normalized_geometry(geometry, field="geometry"):
    """A polygon geometry as stored (``core.geo.normalize``), or an API error."""
    if geometry is None:
        return None
    try:
        return geo.normalize(geometry, GeometryType.POLYGON)
    except geo.GeometryError as exc:
        raise serializers.ValidationError({field: exc.payload})


def save_with_history(record, context, before):
    stamp(record, context.actor)
    save_validated(record)
    record_change(
        instance=record,
        operation=Operation.CREATE if before is None else Operation.UPDATE,
        context=context,
        before=before,
    )
    return record


def cancel_with_history(record, context, error):
    """Delete a record entered by mistake, with a cancellation in the history.
    A record that others refer to is refused with ``error`` (code, detail)."""
    record_id = record.pk
    before = snapshot(record)
    try:
        with transaction.atomic():
            record.delete()
    except (ProtectedError, RestrictedError):
        raise api_error(*error, {"name": str(record)})
    record.pk = record_id
    record_change(
        instance=record, operation=Operation.CANCEL, context=context, before=before
    )


# Zones


def prepare_zone(zone, context, before=None):
    """Rules and defaults of a zone, before saving. A new zone without a code
    gets the next one of its client; a saved zone keeps a code."""
    check_client(zone, context, before)
    if before is not None and zone.code is None:
        raise api_error(
            "zone_code_required", "A saved zone needs a code.", field="code"
        )
    zone.geometry = normalized_geometry(zone.geometry)
    if zone.code is None:
        # The client is locked: two new zones do not get the same code.
        last = Zone.objects.filter(client_id=zone.client_id).aggregate(Max("code"))
        zone.code = (last["code__max"] or 0) + 1
    validate_model(zone)


def commit_zone(zone, context, before=None):
    return save_with_history(zone, context, before)


@transaction.atomic
def create_zone(data, context):
    zone = Zone(**data)
    prepare_zone(zone, context)
    return commit_zone(zone, context)


@transaction.atomic
def update_zone(zone, data, context, expected_revision=None):
    zone = lock_for_change(Zone.objects.editable_by(context.organization), zone.pk)
    check_revision(zone, expected_revision)
    before = snapshot(zone)
    for field, value in data.items():
        setattr(zone, field, value)
    prepare_zone(zone, context, before)
    return commit_zone(zone, context, before)


@transaction.atomic
def delete_zone(zone, context):
    zone = lock_for_change(Zone.objects.editable_by(context.organization), zone.pk)
    cancel_with_history(
        zone,
        context,
        ("zone_has_areas", "The zone has areas: move them to another zone first."),
    )


# Areas


def prepare_area(area, context, before=None):
    """
    Rules and derived values of an area, before saving: the zone of the same
    client, the classifications available to its managing organization (D-027),
    the municipality of the client by default, surface and perimeter from the
    geometry. Overlaps with other areas are warnings (``area_warnings``).
    """
    client = check_client(area, context, before)
    if area.zone_id is not None and area.zone.client_id != area.client_id:
        raise api_error(
            "zone_of_another_client",
            "The zone belongs to another client.",
            field="zone",
        )
    for field in AREA_CLASSIFICATIONS:
        if getattr(area, f"{field}_id") is not None:
            check_available(
                getattr(area, field),
                client.managing_organization,
                field=field,
                previous_id=stored_id(before, field),
            )
    if not area.municipality_code:
        area.municipality_code = client.istat_code
    if not area.municipality_code:
        raise api_error(
            "municipality_code_required",
            "The municipality is required: the client has no ISTAT code.",
            field="municipality_code",
        )
    area.geometry = normalized_geometry(area.geometry)
    if area.geometry is not None:
        measures = geo.geodesic_measures(area.geometry)
        area.surface_m2 = measures["area_m2"]
        area.perimeter_m = measures["perimeter_m"]
    validate_model(area)


def commit_area(area, context, before=None):
    return save_with_history(area, context, before)


@transaction.atomic
def create_area(data, context):
    area = Area(**data)
    prepare_area(area, context)
    return commit_area(area, context)


@transaction.atomic
def update_area(area, data, context, expected_revision=None):
    area = lock_for_change(Area.objects.editable_by(context.organization), area.pk)
    check_revision(area, expected_revision)
    before = snapshot(area)
    for field, value in data.items():
        setattr(area, field, value)
    prepare_area(area, context, before)
    return commit_area(area, context, before)


@transaction.atomic
def delete_area(area, context):
    """Delete an area entered by mistake. An area that is no longer managed is
    closed with ``management_end`` instead."""
    area = lock_for_change(Area.objects.editable_by(context.organization), area.pk)
    cancel_with_history(
        area,
        context,
        (
            "area_has_related_data",
            "The area has related data: close it with the end of the management.",
        ),
    )


def area_warnings(client_id, geometry, start=None, end=None, exclude=None):
    """
    Warnings of an area, which do not block the save (AR-5): the areas of the
    client that it overlaps while managed in the same period.
    """
    if geometry is None:
        return []
    overlapping = Area.objects.overlapping(
        client_id, geometry, start or timezone.localdate(), end
    )
    if exclude is not None:
        overlapping = overlapping.exclude(pk=exclude)
    codes = [str(area) for area in overlapping.order_by("number", "sub_number")]
    if not codes:
        return []
    return [
        error_payload(
            "area_overlaps",
            "The area overlaps other areas of the client.",
            {"areas": ", ".join(codes)},
        )
    ]


# Values of a form that change the overlaps of a perimeter (check_area_geometry).
PROPOSED_AREA_FIELDS = ("management_start", "management_end", "is_fictitious")


def check_area_geometry(client_id, geometry, context, area=None, **proposed):
    """
    Surface, perimeter and warnings of a perimeter of an area of the client,
    before saving it.

    ``proposed`` are the values of the form that matter to the overlaps
    (``PROPOSED_AREA_FIELDS``): the period of the management and whether the
    area is fictitious. ``area`` is the area being changed, of the same client:
    it gives the values the form does not send, and stays out of the overlaps.
    """
    clients = Client.objects.editable_by(context.organization)
    if not clients.filter(pk=client_id).exists():
        raise api_error(
            "client_not_available", "The client is not available.", field="client"
        )
    if area is not None and area.client_id != client_id:
        raise api_error(
            "area_not_available", "The area is not available.", field="area"
        )
    values = {field: getattr(area, field, None) for field in PROPOSED_AREA_FIELDS}
    values.update(proposed)
    measures = geo.geodesic_measures(geometry)
    if values["is_fictitious"]:
        warnings = []
    else:
        warnings = area_warnings(
            client_id,
            geometry,
            values["management_start"],
            values["management_end"],
            exclude=area.pk if area is not None else None,
        )
    return {
        "surface_m2": measures["area_m2"],
        "perimeter_m": measures["perimeter_m"],
        "warnings": warnings,
    }


def warnings_of(area):
    """The warnings of a saved area."""
    if area.is_fictitious:
        return []
    return area_warnings(
        area.client_id,
        area.geometry,
        area.management_start,
        area.management_end,
        exclude=area.pk,
    )
