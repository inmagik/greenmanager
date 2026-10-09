from django.conf import settings
from rest_framework import serializers

from .models import Role, User


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
    roles_data = RoleSerializer_Inline(source="roles", many=True, read_only=True)

    is_locked = serializers.SerializerMethodField(read_only=True, default=False)

    status = serializers.SerializerMethodField()

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
class GrantRoleToUsersSerializer(serializers.Serializer):
    user_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    )
