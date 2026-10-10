from core.admin import ServiceBackedAdminMixin
from django.contrib import admin

from . import services
from .models import Client


@admin.register(Client)
class ClientAdmin(ServiceBackedAdminMixin, admin.ModelAdmin):
    list_display = ("name", "kind", "istat_code", "managing_organization", "active")
    list_filter = ("kind", "active", "managing_organization")
    search_fields = ("name", "tax_code", "istat_code")
    autocomplete_fields = ("managing_organization",)
    readonly_fields = ("created_at", "updated_at", "revision")

    def get_change_organization(self, obj):
        return obj.managing_organization

    def prepare_change(self, obj, context, before):
        services.prepare_client(obj, context, before)

    def commit_change(self, obj, context, before):
        services.commit_client(obj, context, before)

    def remove_change(self, obj, context):
        services.delete_client(obj, context)
