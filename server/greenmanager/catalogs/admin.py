from core.admin import ServiceAdminMixin, add_api_errors
from core.services import stamp
from django import forms
from django.contrib import admin
from rest_framework.exceptions import APIException

from . import services
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


class CatalogAdmin(ServiceAdminMixin, admin.ModelAdmin):
    """The admin changes the entries with the services, with the rules of the API
    (D-046): staff users manage the system entries too."""

    readonly_fields = ("created_at", "updated_at", "revision")

    def prepare(self, request, obj, stored):
        services.prepare_entry(obj, user=request.user, stored=stored)

    def commit(self, request, obj, stored):
        services.commit_entry(obj, user=request.user)

    def remove(self, request, obj):
        services.delete_entry(obj, user=request.user)


class ExtensibleEntryAdminForm(forms.ModelForm):
    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get("organization") and cleaned_data.get("hidden_by"):
            self.add_error("hidden_by", "Solo le voci di sistema si nascondono.")
        return cleaned_data


class ExtensibleCatalogAdmin(CatalogAdmin):
    form = ExtensibleEntryAdminForm
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
    # Name and genus come from the scientific name (services.normalize).
    readonly_fields = ("name", "genus", *CatalogAdmin.readonly_fields)


class ElementClassAttributeAdminForm(forms.ModelForm):
    def clean(self):
        cleaned_data = super().clean()
        attribute = cleaned_data.get("attribute")
        element_class = getattr(self.instance, "element_class", None)
        if attribute is None or element_class is None:
            return cleaned_data
        # An attribute already in the class stays even if hidden or retired.
        if self.instance._state.adding or self.instance.attribute_id != attribute.pk:
            try:
                services.check_class_attribute(
                    element_class, attribute, field="attribute"
                )
            except APIException as exc:
                add_api_errors(self, exc)
        return cleaned_data


class ElementClassAttributeInline(admin.TabularInline):
    model = ElementClassAttribute
    form = ElementClassAttributeAdminForm
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

    def save_formset(self, request, form, formset, change):
        links = formset.save(commit=False)
        for link in formset.deleted_objects:
            link.delete()
        for link in links:
            stamp(link, request.user)
            link.save()
        formset.save_m2m()


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
class UrbanGreenTypeAdmin(CatalogAdmin):
    list_display = ("name", "code", "retired", "sort_order")
    list_filter = ("retired",)
    search_fields = ("name", "code")
