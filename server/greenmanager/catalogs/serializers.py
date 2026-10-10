from core.serializers import TrackedModelSerializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import (
    AreaUse,
    AttributeDefinition,
    ElementClass,
    ElementClassAttribute,
    RemovalCause,
    Species,
    UrbanGreenType,
    UsageIntensity,
)

ENTRY_FIELDS = (
    "id",
    "code",
    "name",
    "description",
    "sort_order",
    "source",
    "retired",
    "is_system",
    "is_hidden",
    "is_available",
)


class CatalogEntrySerializer(TrackedModelSerializer):
    """
    Common fields of the catalog entries.

    - ``is_system``: system entry; a staff user creates one with ``true``. It
      cannot change later.
    - ``is_hidden``, ``is_available``: for the organization of the request
      (annotations of the views).
    - ``code``: generated from the name when empty.
    """

    code = serializers.CharField(required=False, allow_blank=True, max_length=150)
    is_system = serializers.BooleanField(required=False, default=False)
    is_hidden = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()

    class Meta:
        fields = (*ENTRY_FIELDS, *TrackedModelSerializer.tracking_fields)
        # The services validate the entry with the model (constraints included).
        validators = []

    def get_fields(self):
        fields = super().get_fields()
        if self.instance is not None and "is_system" in fields:
            fields["is_system"].read_only = True
        return fields

    def organization(self):
        view = self.context.get("view")
        return view.get_current_tenant() if view is not None else None

    @extend_schema_field(serializers.BooleanField())
    def get_is_hidden(self, obj):
        if hasattr(obj, "is_hidden"):
            return obj.is_hidden
        organization = self.organization()
        if not obj.is_extensible or organization is None:
            return False
        return obj.hidden_by.filter(pk=organization.pk).exists()

    @extend_schema_field(serializers.BooleanField())
    def get_is_available(self, obj):
        if hasattr(obj, "is_available"):
            return obj.is_available
        return (
            type(obj)
            .objects.available_for(self.organization())
            .filter(pk=obj.pk)
            .exists()
        )


class ExtensibleEntrySerializer(CatalogEntrySerializer):
    class Meta(CatalogEntrySerializer.Meta):
        fields = (*CatalogEntrySerializer.Meta.fields, "organization")
        read_only_fields = ("organization",)


class EntryOptionSerializer(serializers.Serializer):
    """An entry to pick in a form: the available entries of the organization."""

    id = serializers.UUIDField()
    code = serializers.CharField()
    name = serializers.CharField()
    is_system = serializers.BooleanField()


class SpeciesSerializer(ExtensibleEntrySerializer):
    parent_data = serializers.SerializerMethodField()

    class Meta(ExtensibleEntrySerializer.Meta):
        model = Species
        fields = (
            *ExtensibleEntrySerializer.Meta.fields,
            "rank",
            "scientific_name",
            "genus",
            "specific_epithet",
            "infraspecific",
            "cultivar",
            "family",
            "common_name",
            "parent",
            "parent_data",
            "synonyms",
            "external_ref",
        )
        # The name of a species is its scientific name.
        read_only_fields = (*ExtensibleEntrySerializer.Meta.read_only_fields, "name")
        extra_kwargs = {"genus": {"required": False, "allow_blank": True}}

    @extend_schema_field(EntryOptionSerializer(allow_null=True))
    def get_parent_data(self, obj):
        if obj.parent is None:
            return None
        return EntryOptionSerializer(obj.parent).data


class SpeciesOptionSerializer(EntryOptionSerializer):
    scientific_name = serializers.CharField()
    common_name = serializers.CharField()
    rank = serializers.CharField()


class AttributeDefinitionSerializer(ExtensibleEntrySerializer):
    class Meta(ExtensibleEntrySerializer.Meta):
        model = AttributeDefinition
        fields = (
            *ExtensibleEntrySerializer.Meta.fields,
            "data_type",
            "unit",
            "choices",
            "is_measure",
        )


class AttributeOptionSerializer(EntryOptionSerializer):
    data_type = serializers.CharField()
    unit = serializers.CharField()
    choices = serializers.ListField(child=serializers.CharField())
    is_measure = serializers.BooleanField()
    retired = serializers.BooleanField()


class ElementClassAttributeSerializer(serializers.ModelSerializer):
    attribute = serializers.PrimaryKeyRelatedField(
        queryset=AttributeDefinition.objects.all()
    )
    attribute_data = AttributeOptionSerializer(source="attribute", read_only=True)

    class Meta:
        model = ElementClassAttribute
        fields = ("id", "attribute", "attribute_data", "required", "sort_order")
        read_only_fields = ("id",)
        extra_kwargs = {"sort_order": {"required": False}}


class ElementClassSerializer(ExtensibleEntrySerializer):
    class_attributes = ElementClassAttributeSerializer(many=True, required=False)

    class Meta(ExtensibleEntrySerializer.Meta):
        model = ElementClass
        fields = (
            *ExtensibleEntrySerializer.Meta.fields,
            "category",
            "geometry_type",
            "quantity_unit",
            "species_mode",
            "counts_as_tree",
            "is_planting_site",
            "class_attributes",
        )


class ElementClassOptionSerializer(EntryOptionSerializer):
    category = serializers.CharField()
    geometry_type = serializers.CharField()
    quantity_unit = serializers.CharField()
    species_mode = serializers.CharField()
    counts_as_tree = serializers.BooleanField()
    class_attributes = ElementClassAttributeSerializer(many=True)


class UrbanGreenTypeSerializer(CatalogEntrySerializer):
    class Meta(CatalogEntrySerializer.Meta):
        model = UrbanGreenType


class AreaUseSerializer(ExtensibleEntrySerializer):
    class Meta(ExtensibleEntrySerializer.Meta):
        model = AreaUse


class UsageIntensitySerializer(ExtensibleEntrySerializer):
    class Meta(ExtensibleEntrySerializer.Meta):
        model = UsageIntensity
        fields = (*ExtensibleEntrySerializer.Meta.fields, "rank")


class UsageIntensityOptionSerializer(EntryOptionSerializer):
    rank = serializers.IntegerField()


class RemovalCauseSerializer(ExtensibleEntrySerializer):
    class Meta(ExtensibleEntrySerializer.Meta):
        model = RemovalCause
        fields = (*ExtensibleEntrySerializer.Meta.fields, "istat_cause")


class RemovalCauseOptionSerializer(EntryOptionSerializer):
    istat_cause = serializers.CharField()
