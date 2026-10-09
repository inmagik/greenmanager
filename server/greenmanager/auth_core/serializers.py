from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from .models import Role, User

ROLE_WRITE_PERMISSION = "auth_core.SCRITTURA_RUOLI"


def is_shared_with_other_tenants(user, tenant):
    """Whether the user is also a member of tenants other than ``tenant``."""
    return user.tenant_memberships.exclude(tenant=tenant).exists()


def shared_user_error(user):
    return serializers.ValidationError(
        {
            "code": "user_shared_with_other_tenants",
            "params": {"name": user.full_name or user.email},
            "detail": "The user is also a member of other tenants.",
        }
    )


class RoleSerializer(serializers.ModelSerializer):
    user_count = serializers.IntegerField(read_only=True)

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

    def get_is_locked(self, obj):
        if getattr(obj, "failed_login_attempts", 0) >= settings.AXES_FAILURE_LIMIT:
            return True
        return False

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
        return user.is_superuser or ROLE_WRITE_PERMISSION in getattr(
            user, "all_permissions", []
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
        self.validate_activation(attrs)
        if self.privileges_change(attrs) and not self.can_manage_privileges():
            raise PermissionDenied(
                {
                    "code": "role_write_permission_required",
                    "detail": "Changing roles or permissions requires "
                    f"{ROLE_WRITE_PERMISSION}.",
                }
            )
        return attrs

    def validate_activation(self, attrs):
        """
        ``is_active`` holds for every tenant of the user: only staff users change
        it for users shared with other tenants.
        """
        instance = self.instance
        if (
            instance is None
            or self.tenant is None
            or "is_active" not in attrs
            or attrs["is_active"] == instance.is_active
        ):
            return
        request = self.context.get("request")
        if request and request.user.is_staff:
            return
        if is_shared_with_other_tenants(instance, self.tenant):
            raise shared_user_error(instance)

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
