from django.contrib import admin

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

# The admin saves the entries directly, with the model validation: it is a tool
# for staff users, who also manage the system entries.


class ExtensibleCatalogAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "organization", "retired", "sort_order")
    list_filter = ("retired", ("organization", admin.EmptyFieldListFilter))
    search_fields = ("name", "code")
    autocomplete_fields = ("organization",)
    filter_horizontal = ("hidden_by",)


@admin.register(Species)
class SpeciesAdmin(ExtensibleCatalogAdmin):
    list_display = (
        "scientific_name",
        "common_name",
        "rank",
        "family",
        "organization",
        "retired",
    )
    list_filter = ("rank", *ExtensibleCatalogAdmin.list_filter)
    search_fields = ("scientific_name", "common_name", "genus", "code")
    autocomplete_fields = ("organization", "parent")


class ElementClassAttributeInline(admin.TabularInline):
    model = ElementClassAttribute
    extra = 0
    autocomplete_fields = ("attribute",)


@admin.register(ElementClass)
class ElementClassAdmin(ExtensibleCatalogAdmin):
    list_display = (
        "name",
        "code",
        "category",
        "geometry_type",
        "species_mode",
        "organization",
        "retired",
    )
    list_filter = ("category", "geometry_type", *ExtensibleCatalogAdmin.list_filter)
    inlines = [ElementClassAttributeInline]


@admin.register(AttributeDefinition)
class AttributeDefinitionAdmin(ExtensibleCatalogAdmin):
    list_display = ("name", "code", "data_type", "is_measure", "retired")
    list_filter = ("data_type", "is_measure", *ExtensibleCatalogAdmin.list_filter)


@admin.register(AreaUse)
class AreaUseAdmin(ExtensibleCatalogAdmin):
    pass


@admin.register(UsageIntensity)
class UsageIntensityAdmin(ExtensibleCatalogAdmin):
    list_display = ("name", "code", "rank", "organization", "retired")


@admin.register(RemovalCause)
class RemovalCauseAdmin(ExtensibleCatalogAdmin):
    list_display = ("name", "code", "istat_cause", "organization", "retired")
    list_filter = ("istat_cause", *ExtensibleCatalogAdmin.list_filter)


@admin.register(UrbanGreenType)
class UrbanGreenTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "retired", "sort_order")
    list_filter = ("retired",)
    search_fields = ("name", "code")
