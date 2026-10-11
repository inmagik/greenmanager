from catalogs.models import ElementClass, RemovalCause
from core.serializers import GeoJSONGeometryField, TrackedModelSerializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from territory.serializers import (
    CatalogSummarySerializer,
    ClientSummarySerializer,
    WarningSerializer,
)

from . import services
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
    "outside_area",
    *TrackedModelSerializer.tracking_fields,
)


def cached_warnings(element, new_position=False):
    """The warnings of an element, computed once per instance."""
    if not hasattr(element, "_warnings"):
        element._warnings = services.element_warnings(element, new_position)
    return element._warnings


class ElementListSerializer(TrackedModelSerializer):
    """An element in the lists: without the geometry. ``outside_area`` is true
    when the element is not within its area (AR-5)."""

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
    outside_area = serializers.SerializerMethodField()

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

    @extend_schema_field(serializers.BooleanField())
    def get_outside_area(self, obj):
        annotated = getattr(obj, "outside_area", None)
        if annotated is not None:
            return annotated
        return any(
            warning["code"] == "element_outside_area"
            for warning in cached_warnings(obj, self.context.get("new_position"))
        )


class ElementSerializer(ElementListSerializer):
    """
    An element. The client is the one of the area; the code is given by the
    server. The geometry is of the type of the class, and gives length or
    surface; with ``location_source`` ``area_center`` the server places the
    point at the center of the area, as a provisional position (EL-10).
    ``composition`` replaces the whole composition; without it, the composition
    does not change. Removal and restoration have their own actions.

    ``warnings`` are the checks that do not block the save (AR-5): the element
    outside its area and, in the response of a write that gives a tree a new
    position, the present trees very close to it.
    """

    geometry = GeoJSONGeometryField(None, required=False)
    composition = CompositionItemSerializer(many=True, required=False)
    replaces_data = ElementSummarySerializer(
        source="replaces", read_only=True, allow_null=True
    )
    warnings = serializers.SerializerMethodField()

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
            "warnings",
        )
        # The services validate the element with the model.
        validators = []

    @extend_schema_field(WarningSerializer(many=True))
    def get_warnings(self, obj):
        return cached_warnings(obj, self.context.get("new_position"))


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


class ElementGeometryCheckSerializer(serializers.Serializer):
    """
    A position to check before saving it, with the class that gives its type.
    ``element`` is the element being changed, ``area`` the area chosen in the
    form, ``client`` the client whose areas to propose.
    """

    element_class = serializers.PrimaryKeyRelatedField(
        queryset=ElementClass.objects.all()
    )
    geometry = GeoJSONGeometryField(None)
    client = serializers.UUIDField(required=False, allow_null=True)
    area = serializers.UUIDField(required=False, allow_null=True)
    element = serializers.UUIDField(required=False, allow_null=True)


class ElementGeometryCheckResultSerializer(serializers.Serializer):
    length_m = serializers.DecimalField(
        max_digits=12, decimal_places=2, allow_null=True
    )
    surface_m2 = serializers.DecimalField(
        max_digits=14, decimal_places=2, allow_null=True
    )
    suggested_area = AreaSummarySerializer(allow_null=True)
    warnings = WarningSerializer(many=True)
