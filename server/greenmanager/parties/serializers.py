from core.serializers import TrackedModelSerializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Client


class OrganizationSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class ClientSerializer(TrackedModelSerializer):
    """A client. ``managing_organization`` defaults to the organization of the
    request; only staff users set another one."""

    managing_organization_data = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = (
            "id",
            "name",
            "kind",
            "istat_code",
            "tax_code",
            "managing_organization",
            "managing_organization_data",
            "contacts",
            "cam_export_srid",
            "active",
            "notes",
            *TrackedModelSerializer.tracking_fields,
        )
        extra_kwargs = {
            "managing_organization": {"required": False},
            # Validated with the model by the services, which keep the error code.
            "istat_code": {"validators": []},
        }
        # The services validate the client with the model.
        validators = []

    @extend_schema_field(OrganizationSummarySerializer())
    def get_managing_organization_data(self, obj):
        return OrganizationSummarySerializer(obj.managing_organization).data


class ClientChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ("id", "name", "kind", "istat_code", "active")
