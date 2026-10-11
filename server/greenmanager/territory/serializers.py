from core.enums import GeometryType
from core.serializers import GeoJSONGeometryField, TrackedModelSerializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from . import services
from .models import Area, Zone


class ClientSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()


class ZoneSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    code = serializers.IntegerField()
    name = serializers.CharField()


class CatalogSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    code = serializers.CharField()
    name = serializers.CharField()


def cached_warnings(area):
    """The warnings of an area, computed once per instance."""
    if not hasattr(area, "_warnings"):
        area._warnings = services.warnings_of(area)
    return area._warnings


class WarningSerializer(serializers.Serializer):
    """A warning that does not block the save (AR-5), translated like the
    errors (``serverErrors.<code>``)."""

    code = serializers.CharField()
    detail = serializers.CharField()
    params = serializers.DictField(child=serializers.CharField(), required=False)


class ZoneSerializer(TrackedModelSerializer):
    """A zone. Without ``code`` it gets the next one of the client."""

    client_data = ClientSummarySerializer(source="client", read_only=True)
    geometry = GeoJSONGeometryField(
        GeometryType.POLYGON, required=False, allow_null=True
    )

    class Meta:
        model = Zone
        fields = (
            "id",
            "client",
            "client_data",
            "code",
            "name",
            "geometry",
            *TrackedModelSerializer.tracking_fields,
        )
        extra_kwargs = {"code": {"required": False, "allow_null": True}}
        # The services validate the zone with the model.
        validators = []


class ZoneChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ("id", "client", "code", "name")


AREA_LIST_FIELDS = (
    "id",
    "client",
    "client_data",
    "zone",
    "zone_data",
    "code",
    "number",
    "sub_number",
    "name",
    "surface_m2",
    "perimeter_m",
    "is_fictitious",
    "urban_green_type",
    "urban_green_type_data",
    "area_use",
    "area_use_data",
    "usage_intensity",
    "usage_intensity_data",
    "management_start",
    "management_end",
    "municipality_code",
    "has_overlaps",
    *TrackedModelSerializer.tracking_fields,
)


class AreaListSerializer(TrackedModelSerializer):
    """An area in the lists: without the geometry."""

    client_data = ClientSummarySerializer(source="client", read_only=True)
    zone_data = ZoneSummarySerializer(source="zone", read_only=True, allow_null=True)
    urban_green_type_data = CatalogSummarySerializer(
        source="urban_green_type", read_only=True
    )
    area_use_data = CatalogSummarySerializer(source="area_use", read_only=True)
    usage_intensity_data = CatalogSummarySerializer(
        source="usage_intensity", read_only=True
    )
    code = serializers.CharField(read_only=True)
    has_overlaps = serializers.SerializerMethodField()

    class Meta:
        model = Area
        fields = AREA_LIST_FIELDS
        read_only_fields = ("surface_m2", "perimeter_m")

    @extend_schema_field(serializers.BooleanField())
    def get_has_overlaps(self, obj):
        annotated = getattr(obj, "has_overlaps", None)
        if annotated is not None:
            return annotated
        return bool(cached_warnings(obj))


class AreaSerializer(AreaListSerializer):
    """
    An area. ``municipality_code`` defaults to the ISTAT code of the client;
    surface and perimeter come from the geometry. ``warnings`` are the checks that
    do not block the save, such as the overlaps with other areas (AR-5).
    """

    geometry = GeoJSONGeometryField(GeometryType.POLYGON)
    warnings = serializers.SerializerMethodField()

    class Meta(AreaListSerializer.Meta):
        fields = (
            *AREA_LIST_FIELDS,
            "geometry",
            "street_code",
            "census_level",
            "surveyed_on",
            "public_excluded",
            "notes",
            "warnings",
        )
        extra_kwargs = {
            "municipality_code": {"required": False, "validators": []},
        }
        # The services validate the area with the model.
        validators = []

    @extend_schema_field(WarningSerializer(many=True))
    def get_warnings(self, obj):
        return cached_warnings(obj)


class AreaChoiceSerializer(serializers.ModelSerializer):
    code = serializers.CharField(read_only=True)

    class Meta:
        model = Area
        fields = ("id", "client", "zone", "code", "name")


class AreaGeometryCheckSerializer(serializers.Serializer):
    """A perimeter to check before saving it: the area being changed, if any,
    gives its period and is left out of the overlaps."""

    client = serializers.UUIDField()
    geometry = GeoJSONGeometryField(GeometryType.POLYGON)
    area = serializers.UUIDField(required=False, allow_null=True)


class AreaGeometryCheckResultSerializer(serializers.Serializer):
    surface_m2 = serializers.DecimalField(max_digits=14, decimal_places=2)
    perimeter_m = serializers.DecimalField(max_digits=12, decimal_places=2)
    warnings = WarningSerializer(many=True)
