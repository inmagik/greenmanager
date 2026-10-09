from auth_core.models import User
from django.db import transaction
from rest_framework.serializers import ValidationError
from tenants.models import Tenant, TenantMembership


def _lock_users(user_ids):
    """Serialize membership/default changes for each user in a stable order."""
    return {
        user.id: user
        for user in User.objects.select_for_update()
        .filter(pk__in=user_ids)
        .order_by("pk")
    }


def _lock_tenant(tenant):
    return Tenant.objects.select_for_update().get(pk=tenant.pk)


@transaction.atomic
def replace_tenant_users(tenant, users):
    tenant = _lock_tenant(tenant)
    selected_ids = {user.id for user in users}
    current_ids = set(tenant.memberships.values_list("user_id", flat=True))
    locked_users = _lock_users(selected_ids | current_ids)
    users_by_id = {user_id: locked_users[user_id] for user_id in selected_ids}
    removed_users = list(
        tenant.memberships.exclude(user_id__in=selected_ids).values_list(
            "user_id", flat=True
        )
    )
    tenant.memberships.exclude(user_id__in=selected_ids).delete()

    existing_ids = set(tenant.memberships.values_list("user_id", flat=True))
    TenantMembership.objects.bulk_create(
        [
            TenantMembership(
                tenant=tenant,
                user=user,
                is_default=not user.tenant_memberships.filter(is_default=True).exists(),
            )
            for user in users_by_id.values()
            if user.id not in existing_ids
        ]
    )

    for user_id in removed_users:
        ensure_default_membership_id(user_id)
    return selected_ids


@transaction.atomic
def add_tenant_users(tenant, users):
    tenant = _lock_tenant(tenant)
    selected_ids = {user.id for user in users}
    users_by_id = _lock_users(selected_ids)
    existing_ids = set(
        tenant.memberships.filter(user_id__in=selected_ids).values_list(
            "user_id", flat=True
        )
    )
    TenantMembership.objects.bulk_create(
        [
            TenantMembership(
                tenant=tenant,
                user=user,
                is_default=not user.tenant_memberships.filter(is_default=True).exists(),
            )
            for user in users_by_id.values()
            if user.id not in existing_ids
        ]
    )
    return selected_ids


@transaction.atomic
def save_membership(serializer, **extra):
    """Create or update a membership, keeping a default one for each user involved."""
    user_ids = set()
    if serializer.instance is not None:
        user_ids.add(serializer.instance.user_id)
    if "user" in serializer.validated_data:
        user_ids.add(serializer.validated_data["user"].id)
    _lock_users(user_ids)
    membership = serializer.save(**extra)
    for user_id in sorted(user_ids):
        ensure_default_membership_id(user_id)
    return membership


def ensure_default_membership_id(user_id):
    membership = (
        TenantMembership.objects.filter(user_id=user_id).order_by("created_at").first()
    )
    if (
        membership
        and not TenantMembership.objects.filter(
            user_id=user_id, is_default=True
        ).exists()
    ):
        membership.is_default = True
        membership.save(update_fields=["is_default"])


@transaction.atomic
def remove_tenant_user(tenant, user):
    tenant = _lock_tenant(tenant)
    _lock_users([user.id])
    deleted, _ = tenant.memberships.filter(user=user).delete()
    if not deleted:
        raise ValidationError(
            {
                "code": "user_not_associated_with_tenant",
                "params": {"name": user.full_name or user.email},
                "detail": "User is not associated with this tenant.",
            }
        )
    ensure_default_membership_id(user.id)
