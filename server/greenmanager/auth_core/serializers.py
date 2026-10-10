from django.conf import settings
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from .models import Role, User
from .permission_manager import permission_manager
from .utils import tenant_permissions

ROLE_WRITE_PERMISSION = "auth_core.WRITE_ROLES"

# Fields of the account that hold for every tenant of the user: only staff users
# change them for users shared with other tenants. The email matters most: who
# changes it can recover the password and use the account in the other tenants.
# The direct permissions too hold in every tenant (see tenant_permissions): only
# staff users change them, for every user (validate_direct_permissions).
SHARED_ACCOUNT_FIELDS = ("email", "is_active")

USER_STATUSES = ("active", "inactive", "locked")


def is_shared_with_other_tenants(user, tenant):
    """Whether the user is also a member of tenants other than ``tenant``."""
    return user.tenant_memberships.exclude(tenant=tenant).exists()


def same_value(new, current):
    """Equality of field values; lists (the permissions) regardless of order."""
    if isinstance(new, list) and isinstance(current, list):
        return set(new) == set(current)
    return new == current


def api_error(payload, field=None):
    """ValidationError with a ``{"code", "params", "detail"}`` payload.

    In ``Serializer.validate()`` the payload goes under a field: DRF would turn
    the values of a top-level payload into lists, and the frontend would no
    longer recognise the code.
    """
    return serializers.ValidationError({field: payload} if field else payload)


def shared_user_error(user, field=None):
    return api_error(
        {
            "code": "user_shared_with_other_tenants",
            "params": {"name": user.full_name or user.email},
            "detail": "The user is also a member of other tenants.",
        },
        field,
    )


def own_account_error(field=None):
    return api_error(
        {
            "code": "cannot_change_own_account",
            "detail": "Users cannot deactivate or delete their own account.",
        },
        field,
    )


def validate_permission_codes(codes):
    known = {permission["code"] for permission in permission_manager.permissions}
    unknown = sorted(set(codes) - known)
    if unknown:
        raise serializers.ValidationError(
            {
                "code": "unknown_permission",
                "params": {"permissions": ", ".join(unknown)},
                "detail": f"Unknown permissions: {', '.join(unknown)}.",
            }
        )
    return codes


class RoleSerializer(serializers.ModelSerializer):
    user_count = serializers.IntegerField(read_only=True)

    def validate_permissions(self, value):
        return validate_permission_codes(value)

    class Meta:
        model = Role
        fields = (
            "id",
            "tenant",
            "name",
            "permissions",
            "user_count",
        )
        read_only_fields = ("id", "tenant")


class RoleSerializer_Inline(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "tenant", "name", "permissions")
        read_only_fields = ("id", "tenant")


class UpdateMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("full_name",)


class UserSerializer(serializers.ModelSerializer):
    """
    User as seen from the tenant of the request (``context["tenant"]``).

    With a tenant, roles, permissions and memberships are limited to that tenant:
    roles of other tenants are neither shown nor replaced, and only staff users
    see the other memberships. Without a tenant (``me/``) the user sees all
    of their own data.
    """

    roles = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Role.objects.none(), required=False
    )
    roles_data = RoleSerializer_Inline(source="roles", many=True, read_only=True)

    is_locked = serializers.SerializerMethodField(read_only=True, default=False)

    status = serializers.SerializerMethodField()

    def validate_permissions(self, value):
        return validate_permission_codes(value)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = self.tenant
        if tenant is not None and "roles" in self.fields:
            self.fields["roles"].child_relation.queryset = Role.objects.filter(
                tenant=tenant
            )

    @property
    def tenant(self):
        return self.context.get("tenant")

    def get_is_locked(self, obj) -> bool:
        if getattr(obj, "failed_login_attempts", 0) >= settings.AXES_FAILURE_LIMIT:
            return True
        return False

    @extend_schema_field(serializers.ChoiceField(choices=USER_STATUSES))
    def get_status(self, obj):
        if not obj.is_active:
            return "inactive"
        elif self.get_is_locked(obj):
            return "locked"
        else:
            return "active"

    def tenant_roles(self, user):
        return [role for role in user.roles.all() if role.tenant_id == self.tenant.id]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.tenant is None:
            return data
        roles = self.tenant_roles(instance)
        data["roles"] = [role.id for role in roles]
        data["roles_data"] = RoleSerializer_Inline(roles, many=True).data
        data["all_permissions"] = sorted(
            set(instance.permissions)
            | {permission for role in roles for permission in role.permissions}
        )
        request = self.context.get("request")
        if not (request and request.user.is_staff):
            data["tenants"] = [
                tenant_id
                for tenant_id in data["tenants"]
                if tenant_id == self.tenant.id
            ]
        return data

    def can_manage_privileges(self):
        request = self.context.get("request")
        if request is None:
            return False
        user = request.user
        return user.is_superuser or ROLE_WRITE_PERMISSION in tenant_permissions(
            user, self.tenant
        )

    def privileges_change(self, attrs):
        """Whether the request changes the roles or the direct permissions."""
        instance = self.instance
        if "roles" in attrs:
            current = (
                {role.id for role in self.tenant_roles(instance)}
                if instance is not None and self.tenant is not None
                else set()
            )
            if {role.id for role in attrs["roles"]} != current:
                return True
        if "permissions" in attrs:
            current = set(instance.permissions) if instance is not None else set()
            if set(attrs["permissions"]) != current:
                return True
        return False

    def validate(self, attrs):
        attrs = super().validate(attrs)
        self.validate_shared_account(attrs)
        if self.privileges_change(attrs) and not self.can_manage_privileges():
            raise PermissionDenied(
                {
                    "code": "role_write_permission_required",
                    "detail": "Changing roles or permissions requires "
                    f"{ROLE_WRITE_PERMISSION}.",
                }
            )
        self.validate_direct_permissions(attrs)
        return attrs

    def validate_direct_permissions(self, attrs):
        """
        The direct permissions hold in every tenant of the user: only staff users
        change them. Inside an organization the permissions come from its roles.
        """
        if "permissions" not in attrs:
            return
        current = self.instance.permissions if self.instance is not None else []
        if same_value(attrs["permissions"], current):
            return
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is not None and (user.is_staff or user.is_superuser):
            return
        raise api_error(
            {
                "code": "direct_permissions_staff_only",
                "detail": "Only staff users change the direct permissions.",
            },
            field="permissions",
        )

    def validate_shared_account(self, attrs):
        """
        Email and activation hold for every tenant of the user (see
        ``SHARED_ACCOUNT_FIELDS``): only staff users change them for users shared
        with other tenants. Nobody deactivates their own account.
        """
        instance = self.instance
        if instance is None:
            return
        changed = [
            field
            for field in SHARED_ACCOUNT_FIELDS
            if field in attrs and not same_value(attrs[field], getattr(instance, field))
        ]
        if not changed:
            return
        request = self.context.get("request")
        if (
            "is_active" in changed
            and request is not None
            and request.user.pk == instance.pk
        ):
            raise own_account_error(field="is_active")
        if self.tenant is None or (request and request.user.is_staff):
            return
        if is_shared_with_other_tenants(instance, self.tenant):
            raise shared_user_error(instance, field=changed[0])

    def update(self, instance, validated_data):
        roles = validated_data.pop("roles", None)
        instance = super().update(instance, validated_data)
        if roles is not None:
            other_tenant_roles = (
                list(instance.roles.exclude(tenant=self.tenant))
                if self.tenant is not None
                else []
            )
            instance.roles.set([*other_tenant_roles, *roles])
        return instance

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "date_joined",
            "last_login",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_locked",
            "roles",
            "roles_data",
            "tenants",
            "permissions",
            "all_permissions",
            "status",
        )
        read_only_fields = (
            "id",
            "date_joined",
            "last_login",
            "is_staff",
            "is_superuser",
            "all_permissions",
            "roles_data",
            "is_locked",
            "status",
        )


# Action specific serializers
class RoleUsersSerializer(serializers.Serializer):
    """Users to grant a role to, or to revoke it from: members of the tenant only."""

    user_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.none())
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = self.context.get("tenant")
        if tenant is not None:
            self.fields["user_ids"].child.queryset = User.objects.filter(
                tenant_memberships__tenant=tenant
            )
