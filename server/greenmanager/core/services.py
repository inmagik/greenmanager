"""History of the domain changes (ChangeRecord) and other helpers of the services."""

import datetime
import decimal
import json
import uuid
from dataclasses import dataclass
from typing import Any

from django.contrib.gis.geos import GEOSGeometry
from rest_framework.exceptions import NotFound

from .errors import error_payload
from .models import TRACKING_FIELDS, ChangeRecord

CHANGE_SOURCE_HEADER = "HTTP_X_CHANGE_SOURCE"
# Sources a client can declare: the others are set by the system itself.
CLIENT_CHANGE_SOURCES = {ChangeRecord.Source.WEB, ChangeRecord.Source.FIELD}


@dataclass(frozen=True)
class ChangeContext:
    """Who changes the data, for which organization and from where."""

    actor: Any
    organization: Any
    source: str = ChangeRecord.Source.WEB

    @property
    def is_staff(self):
        return bool(getattr(self.actor, "is_staff", False))


def lock_for_change(queryset, pk):
    """
    The record ``pk`` of ``queryset``, locked until the end of the transaction.

    ``queryset`` gives the scope of the change (e.g. ``editable_by(org)``), which
    is checked again under the lock: a record moved out of scope after the view
    found it is not found (404). Only the record is locked, not the joined ones.
    """
    instance = queryset.select_for_update(of=("self",)).filter(pk=pk).first()
    if instance is None:
        raise NotFound(error_payload("not_found", "Not found."))
    return instance


def change_source(request):
    """Source declared by the client in ``X-Change-Source`` (web or field)."""
    value = request.META.get(CHANGE_SOURCE_HEADER, "").strip().lower()
    return value if value in CLIENT_CHANGE_SOURCES else ChangeRecord.Source.WEB


def stamp(instance, actor):
    """Set the author of the creation or of the last change of the record."""
    user = actor if getattr(actor, "is_authenticated", False) else None
    if instance._state.adding:
        instance.created_by = user
    instance.updated_by = user


def json_value(value):
    """A value of a field as plain JSON: keys as strings, geometries as GeoJSON."""
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, GEOSGeometry):
        return json.loads(value.geojson)
    if isinstance(value, (uuid.UUID, decimal.Decimal)):
        return str(value)
    if isinstance(value, (datetime.date, datetime.datetime, datetime.time)):
        return value.isoformat()
    if isinstance(value, (list, tuple)):
        return [json_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): json_value(item) for key, item in value.items()}
    return str(value)


def snapshot(instance):
    """Values of the concrete fields of the record, without the tracking fields.

    Foreign keys are stored as the key of the related record, under the name of
    the field (e.g. ``"zone"``).
    """
    values = {}
    for field in instance._meta.concrete_fields:
        if field.primary_key or field.name in TRACKING_FIELDS:
            continue
        value = getattr(instance, field.attname)
        values[field.name] = json_value(value)
    return values


def diff(before, after):
    return {
        key: {"old": before.get(key), "new": after.get(key)}
        for key in sorted(set(before) | set(after))
        if before.get(key) != after.get(key)
    }


def record_change(
    *,
    instance,
    operation,
    context,
    before=None,
    after=None,
    reason="",
    client_id=None,
):
    """
    Write the ChangeRecord of a change, in the transaction of the change.

    ``before`` and ``after`` are snapshots: ``after`` defaults to the current
    values of ``instance``. A change without differences writes nothing.
    ``client_id`` defaults to the ``client`` of the record.
    """
    Operation = ChangeRecord.Operation
    if operation == Operation.CREATE:
        after = snapshot(instance) if after is None else after
        changes = diff({}, after)
    elif operation == Operation.UPDATE:
        after = snapshot(instance) if after is None else after
        changes = diff(before or {}, after)
        if not changes:
            return None
    elif operation == Operation.CANCEL:
        changes = diff(before or {}, {})
    else:
        raise ValueError(f"Unknown operation: {operation}")

    actor = context.actor if getattr(context.actor, "is_authenticated", False) else None
    if client_id is None:
        client_id = getattr(instance, "client_id", None)
    return ChangeRecord.objects.create(
        entity=instance._meta.label_lower,
        record_id=instance.pk,
        client_id=client_id,
        operation=operation,
        changes=changes,
        reason=reason,
        author=actor,
        author_label=user_label(actor),
        organization=context.organization,
        source=context.source,
    )


def user_label(user):
    if user is None:
        return ""
    return getattr(user, "full_name", "") or user.get_username()
