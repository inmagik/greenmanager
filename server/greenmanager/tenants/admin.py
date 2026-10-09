from django.contrib import admin
from tenants.models import Tenant, TenantMembership


class TenantMembershipInline(admin.TabularInline):
    model = TenantMembership
    extra = 0
    autocomplete_fields = ["user"]


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "created_at", "updated_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ["name"]}
    inlines = [TenantMembershipInline]


@admin.register(TenantMembership)
class TenantMembershipAdmin(admin.ModelAdmin):
    list_display = ["tenant", "user", "is_default", "created_at"]
    list_filter = ["tenant", "is_default"]
    search_fields = ["tenant__name", "tenant__slug", "user__email", "user__full_name"]
    autocomplete_fields = ["tenant", "user"]
