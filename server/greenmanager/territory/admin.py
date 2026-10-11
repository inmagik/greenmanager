from core.admin import ServiceBackedAdminMixin
from django.contrib.gis import admin

from . import services
from .models import Area, Zone


class AssetAdmin(ServiceBackedAdminMixin, admin.GISModelAdmin):
    """Zones and areas change through the services, with the history."""

    readonly_fields = ("created_at", "updated_at", "revision")

    def get_change_organization(self, obj):
        return obj.client.managing_organization


@admin.register(Zone)
class ZoneAdmin(AssetAdmin):
    list_display = ("code", "name", "client")
    list_filter = ("client",)
    search_fields = ("name",)
    autocomplete_fields = ("client",)

    def prepare_change(self, obj, context, before):
        services.prepare_zone(obj, context, before)

    def commit_change(self, obj, context, before):
        services.commit_zone(obj, context, before)

    def remove_change(self, obj, context):
        services.delete_zone(obj, context)


@admin.register(Area)
class AreaAdmin(AssetAdmin):
    list_display = (
        "number",
        "sub_number",
        "name",
        "client",
        "zone",
        "surface_m2",
        "management_end",
    )
    list_filter = ("client", "is_fictitious", "urban_green_type")
    search_fields = ("number", "name")
    autocomplete_fields = (
        "client",
        "zone",
        "urban_green_type",
        "area_use",
        "usage_intensity",
    )
    readonly_fields = ("surface_m2", "perimeter_m", *AssetAdmin.readonly_fields)

    def prepare_change(self, obj, context, before):
        services.prepare_area(obj, context, before)

    def commit_change(self, obj, context, before):
        services.commit_area(obj, context, before)

    def remove_change(self, obj, context):
        services.delete_area(obj, context)
