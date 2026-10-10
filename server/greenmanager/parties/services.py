"""Rules of the clients (A1, D-013, D-032)."""

from core.errors import api_error, check_revision, permission_error, validate_model
from core.models import ChangeRecord
from core.services import lock_for_change, record_change, snapshot, stamp
from django.db import transaction
from django.db.models.deletion import ProtectedError, RestrictedError

from .models import Client

Operation = ChangeRecord.Operation


def prepare_client(client, context, before=None):
    """
    Rules and defaults of a client, before saving.

    The managing organization is the organization of the change; only staff
    users assign a client to another organization (e.g. K2 in §4.7).
    """
    if client.managing_organization_id is None:
        client.managing_organization = context.organization
    previous = before.get("managing_organization") if before else None
    if (
        client.managing_organization_id != (previous or context.organization.pk)
        and not context.is_staff
    ):
        raise permission_error(
            "managing_organization_staff_only",
            "Only staff users change the managing organization of a client.",
        )
    validate_model(client)


def commit_client(client, context, before=None):
    """Save a prepared client and its history."""
    stamp(client, context.actor)
    client.save()
    record_change(
        instance=client,
        operation=Operation.CREATE if before is None else Operation.UPDATE,
        context=context,
        before=before,
        client_id=client.pk,
    )
    return client


@transaction.atomic
def create_client(data, context):
    client = Client(**data)
    prepare_client(client, context)
    return commit_client(client, context)


def lock_client(client, context):
    """The client, locked, if the organization of the change can still edit it."""
    return lock_for_change(Client.objects.editable_by(context.organization), client.pk)


@transaction.atomic
def update_client(client, data, context, expected_revision=None):
    client = lock_client(client, context)
    check_revision(client, expected_revision)
    before = snapshot(client)
    for field, value in data.items():
        setattr(client, field, value)
    prepare_client(client, context, before)
    return commit_client(client, context, before)


@transaction.atomic
def delete_client(client, context):
    """Delete a client entered by mistake: one with data is deactivated instead."""
    client = lock_client(client, context)
    client_id = client.pk
    before = snapshot(client)
    try:
        with transaction.atomic():
            client.delete()
    except (ProtectedError, RestrictedError):
        raise api_error(
            "client_has_related_data",
            "The client has related data: deactivate it instead.",
            {"name": client.name},
        )
    client.pk = client_id
    record_change(
        instance=client,
        operation=Operation.CANCEL,
        context=context,
        before=before,
        client_id=client_id,
    )
