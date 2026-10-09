from auth_core.models import User
from rest_framework import serializers
from tenants.models import Tenant, TenantMembership


class TenantSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    def get_user_count(self, obj):
        annotated_count = obj.__dict__.get("user_count")
        if annotated_count is not None:
            return annotated_count
        return obj.memberships.count()

    class Meta:
        model = Tenant
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class TenantSummarySerializer(serializers.ModelSerializer):
    """
    Tenant fields safe to embed when the queryset has no membership count
    annotation.
    """

    class Meta:
        model = Tenant
        fields = ["id", "name", "slug", "is_active", "created_at", "updated_at"]
        read_only_fields = fields


class TenantMembershipSerializer(serializers.ModelSerializer):
    tenant_data = TenantSummarySerializer(source="tenant", read_only=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        is_default = attrs.get(
            "is_default", getattr(self.instance, "is_default", False)
        )
        user = attrs.get("user", getattr(self.instance, "user", None))

        if is_default and user is not None:
            qs = TenantMembership.objects.filter(user=user, is_default=True)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {
                        "is_default": {
                            "code": "user_already_has_default_tenant",
                            "detail": "User already has a default tenant.",
                        }
                    }
                )

        return attrs

    class Meta:
        model = TenantMembership
        fields = ["id", "tenant", "tenant_data", "user", "is_default", "created_at"]
        read_only_fields = ["created_at", "tenant_data"]


class TenantUsersSerializer(serializers.Serializer):
    user_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    )


class TenantUserSerializer(serializers.ModelSerializer):
    is_member = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "is_member"]


class RemoveTenantUserSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())


class BulkDeleteTenantsSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Tenant.objects.none())
    )

    def __init__(self, *args, queryset=None, **kwargs):
        super().__init__(*args, **kwargs)
        if queryset is not None:
            self.fields["ids"].child.queryset = queryset
