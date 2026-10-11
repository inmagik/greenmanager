from catalogs.models import RemovalCause
from core.serializers import GeoJSONGeometryField, TrackedModelSerializer
from rest_framework import serializers
from territory.serializers import CatalogSummarySerializer, ClientSummarySerializer

from .models import CompositionItem, Element


class AreaSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    code = serializers.CharField()
    name = serializers.CharField()


class ElementClassSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    code = serializers.CharField()
    name = serializers.CharField()
    category = serializers.CharField()
    geometry_type = serializers.CharField()
    species_mode = serializers.CharField()


class SpeciesSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    scientific_name = serializers.CharField()
    common_name = serializers.CharField()


class ElementSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    code = serializers.CharField()


class CompositionItemSerializer(serializers.ModelSerializer):
    """A species of the composition, with its quantity or percentage."""

    species_data = SpeciesSummarySerializer(source="species", read_only=True)

    class Meta:
        model = CompositionItem
        fields = ("species", "species_data", "quantity", "percentage")
        # The services check the composition as a whole.
        validators = []


ELEMENT_LIST_FIELDS = (
    "id",
    "client",
    "client_data",
    "area",
    "area_data",
    "element_class",
    "element_class_data",
    "species",
    "species_data",
    "code",
    "tag_number",
    "location_status",
    "length_m",
    "surface_m2",
    "estimated_count",
    "planted_on",
    "removed_on",
    "removal_cause",
    "removal_cause_data",
    *TrackedModelSerializer.tracking_fields,
)


class ElementListSerializer(TrackedModelSerializer):
    """An element in the lists: without the geometry."""

    client_data = ClientSummarySerializer(source="client", read_only=True)
    area_data = AreaSummarySerializer(source="area", read_only=True)
    element_class_data = ElementClassSummarySerializer(
        source="element_class", read_only=True
    )
    species_data = SpeciesSummarySerializer(
        source="species", read_only=True, allow_null=True
    )
    removal_cause_data = CatalogSummarySerializer(
        source="removal_cause", read_only=True, allow_null=True
    )

    class Meta:
        model = Element
        fields = ELEMENT_LIST_FIELDS
        read_only_fields = (
            "client",
            "code",
            "length_m",
            "surface_m2",
            "removed_on",
            "removal_cause",
        )


class ElementSerializer(ElementListSerializer):
    """
    An element. The client is the one of the area; the code is given by the
    server. The geometry is of the type of the class, and gives length or
    surface. ``composition`` replaces the whole composition; without it, the
    composition does not change. Removal and restoration have their own actions.
    """

    geometry = GeoJSONGeometryField(None)
    composition = CompositionItemSerializer(many=True, required=False)
    replaces_data = ElementSummarySerializer(
        source="replaces", read_only=True, allow_null=True
    )

    class Meta(ElementListSerializer.Meta):
        fields = (
            *ELEMENT_LIST_FIELDS,
            "geometry",
            "location_source",
            "location_accuracy_m",
            "attributes",
            "composition",
            "planted_on_estimated",
            "replaces",
            "replaces_data",
            "surveyed_on",
            "public_excluded",
            "notes",
        )
        # The services validate the element with the model.
        validators = []


class ElementChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Element
        fields = (
            "id",
            "client",
            "area",
            "element_class",
            "code",
            "tag_number",
            "removed_on",
        )


class ElementRemoveSerializer(serializers.Serializer):
    """The removal of an element (EL-7), or the correction of its date and
    cause."""

    removed_on = serializers.DateField()
    removal_cause = serializers.PrimaryKeyRelatedField(
        queryset=RemovalCause.objects.all(), required=False, allow_null=True
    )
    reason = serializers.CharField(required=False, allow_blank=True)
    revision = serializers.IntegerField(required=False, min_value=1)


class ElementRestoreSerializer(serializers.Serializer):
    """The restoration of an element removed by mistake."""

    reason = serializers.CharField(required=False, allow_blank=True)
    revision = serializers.IntegerField(required=False, min_value=1)
