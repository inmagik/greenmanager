from django.contrib.gis import admin
from territory.admin import AssetAdmin

from . import services
from .models import CompositionItem, Element


class CompositionItemInline(admin.TabularInline):
    """The composition, read-only: it changes through the API, whose services
    check it as a whole."""

    model = CompositionItem
    fields = ("species", "quantity", "percentage")
    readonly_fields = fields
    extra = 0

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Element)
class ElementAdmin(AssetAdmin):
    list_display = (
        "code",
        "element_class",
        "species",
        "client",
        "area",
        "tag_number",
        "removed_on",
    )
    list_filter = ("client", "element_class", "location_status")
    search_fields = ("code", "tag_number")
    autocomplete_fields = (
        "area",
        "element_class",
        "species",
        "replaces",
        "removal_cause",
    )
    readonly_fields = (
        "code",
        "client",
        "length_m",
        "surface_m2",
        "removed_on",
        "removal_cause",
        *AssetAdmin.readonly_fields,
    )
    inlines = (CompositionItemInline,)

    def get_change_organization(self, obj):
        # A new element has no client yet: the one of its area.
        return obj.area.client.managing_organization

    def prepare_change(self, obj, context, before):
        services.prepare_element(obj, context, before)

    def commit_change(self, obj, context, before):
        services.commit_element(obj, context, before)

    def remove_change(self, obj, context):
        services.delete_element(obj, context)
