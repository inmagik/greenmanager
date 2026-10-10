from django.contrib import admin
from tenants.models import Tenant, TenantMembership
from tenants.services import ensure_default_membership_id


def ensure_default_memberships(user_ids):
    for user_id in sorted(set(user_ids)):
        ensure_default_membership_id(user_id)


class MembershipInlineAdminMixin:
    """Keep a default membership for the users whose memberships the inline changes.

    The API goes through tenants.services; the admin changes the rows directly.
    """

    def save_formset(self, request, form, formset, change):
        if formset.model is not TenantMembership:
            return super().save_formset(request, form, formset, change)
        # Users of the memberships before the save: a membership can move to
        # another user, and the previous one may lose their default.
        previous_user_ids = [
            membership_form.initial["user"]
            for membership_form in formset.forms
            if membership_form.instance.pk and membership_form.initial.get("user")
        ]
        super().save_formset(request, form, formset, change)
        ensure_default_memberships(
            [
                *previous_user_ids,
                *(
                    membership.user_id
                    for membership in [
                        *formset.new_objects,
                        *(obj for obj, _ in formset.changed_objects),
                        *formset.deleted_objects,
                    ]
                ),
            ]
        )


class TenantMembershipInline(admin.TabularInline):
    model = TenantMembership
    extra = 0
    autocomplete_fields = ["user"]


@admin.register(Tenant)
class TenantAdmin(MembershipInlineAdminMixin, admin.ModelAdmin):
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

    def save_model(self, request, obj, form, change):
        previous_user_id = form.initial.get("user") if change else None
        super().save_model(request, obj, form, change)
        ensure_default_memberships(filter(None, [previous_user_id, obj.user_id]))

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        ensure_default_memberships([obj.user_id])

    def delete_queryset(self, request, queryset):
        user_ids = list(queryset.values_list("user_id", flat=True))
        super().delete_queryset(request, queryset)
        ensure_default_memberships(user_ids)
