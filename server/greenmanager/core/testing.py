"""Helpers of the tests of the domain apps."""

from auth_core.models import Role
from django.contrib.auth import get_user_model
from tenants.models import Tenant, TenantMembership


def make_tenant(name):
    return Tenant.objects.create(name=name, slug=name.lower().replace(" ", "-"))


def make_user(email, tenant=None, permissions=(), **extra):
    """A user, member of ``tenant`` with a role that grants ``permissions``."""
    user = get_user_model().objects.create_user(email=email, **extra)
    if tenant is not None:
        TenantMembership.objects.create(tenant=tenant, user=user, is_default=True)
        if permissions:
            role = Role.objects.create(
                tenant=tenant, name=f"Role of {email}", permissions=list(permissions)
            )
            user.roles.add(role)
    return user


def tenant_header(tenant):
    return {"HTTP_X_TENANT_ID": str(tenant.pk)}
