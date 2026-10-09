from django.contrib import admin
from django.contrib.auth.models import Group as DefaultAuthGroup
from django.contrib.postgres.fields import ArrayField
from django.forms.widgets import CheckboxSelectMultiple
from tenants.admin import MembershipInlineAdminMixin
from tenants.models import TenantMembership
from userbase.admin import UserAdmin as BaseUserAdmin

from .models import Role, User

# Remove the built-in Group model from the admin: it is not used and it can be
# confused with the userbase groups.
admin.site.unregister(DefaultAuthGroup)


class PermissionsSelectMultiple(CheckboxSelectMultiple):
    """
    Custom widget for displaying permissions as checkboxes in the admin interface.
    """

    def _normalize_values(self, value):
        if isinstance(value, list):
            return value
        return value.split(",") if value else []

    def format_value(self, value):
        # Ensure the selected values coming from ArrayField match choice values
        # as strings.
        return self._normalize_values(value)

    def get_context(self, name, value, attrs):
        # Also normalize in context path to cover admin rendering flow consistently.
        value = self._normalize_values(value)
        return super().get_context(name, value, attrs)

    def optgroups(self, name, value, attrs=None):
        from .permission_manager import permission_manager

        self.choices = [
            (str(perm["code"]).strip(), perm["name"])
            for perm in permission_manager.permissions
        ]
        # value = self._normalize_values(value)
        return super().optgroups(name, value, attrs)


class TenantMembershipInline(admin.TabularInline):
    model = TenantMembership
    extra = 0
    autocomplete_fields = ("tenant",)


@admin.register(User)
class UserAdmin(MembershipInlineAdminMixin, BaseUserAdmin):
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "email",
                    "full_name",
                    "password",
                    "is_staff",
                    "is_active",
                    "is_superuser",
                    "last_login",
                    "date_joined",
                ),
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "roles",
                    "permissions",
                ),
            },
        ),
        (
            "All permissions",
            {
                "fields": ("all_permissions",),
            },
        ),
    )
    readonly_fields = (
        "date_joined",
        "last_login",
        "all_permissions",
    )
    add_fieldsets = (
        (
            None,
            {
                "fields": (
                    "email",
                    "password1",
                    "password2",
                )
            },
        ),
    )
    list_display = ("email",)
    list_filter = (
        "is_staff",
        "is_active",
    )
    search_fields = ("email",)
    ordering = ("email",)
    filter_horizontal = tuple([])
    inlines = (TenantMembershipInline,)
    formfield_overrides = {
        ArrayField: {"widget": PermissionsSelectMultiple},
    }


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "tenant")
    list_filter = ("tenant",)
    search_fields = ("name", "tenant__name", "tenant__slug")
    autocomplete_fields = ("tenant",)
    formfield_overrides = {
        ArrayField: {"widget": PermissionsSelectMultiple},
    }
