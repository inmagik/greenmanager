from django.contrib import admin
from django.core.exceptions import NON_FIELD_ERRORS
from rest_framework.exceptions import APIException

from .models import ChangeRecord
from .services import ChangeContext, snapshot


@admin.register(ChangeRecord)
class ChangeRecordAdmin(admin.ModelAdmin):
    """The history is read-only, in the admin too."""

    list_display = (
        "recorded_at",
        "entity",
        "record_id",
        "operation",
        "source",
        "author_label",
        "organization",
    )
    list_filter = ("operation", "source", "entity", "organization")
    search_fields = ("record_id", "client_id", "author_label", "reason")
    date_hierarchy = "recorded_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


def api_error_messages(detail):
    """Messages of an API error by field, for a Django form."""

    def flatten(value):
        if isinstance(value, dict):
            if "code" in value and "detail" in value:
                return [str(value["detail"])]
            return [message for item in value.values() for message in flatten(item)]
        if isinstance(value, (list, tuple)):
            return [message for item in value for message in flatten(item)]
        return [str(value)]

    if isinstance(detail, dict) and not ("code" in detail and "detail" in detail):
        return {field: flatten(value) for field, value in detail.items()}
    return {NON_FIELD_ERRORS: flatten(detail)}


class ServiceBackedAdminMixin:
    """
    Admin of a domain model whose changes go through the domain services, so that
    they also write the ChangeRecord (source ``system``) and the derived values.

    The subclass implements:
    - ``get_change_organization(obj)``: organization the change is made for;
    - ``prepare(obj, context, before)``: rules and derived values, without saving;
      it raises the API errors, which the form shows;
    - ``commit(obj, context, before)``: saves the prepared record and its history;
    - ``remove(obj, context)``: deletes the record.
    """

    def get_change_organization(self, obj):
        raise NotImplementedError

    def prepare(self, obj, context, before):
        raise NotImplementedError

    def commit(self, obj, context, before):
        raise NotImplementedError

    def remove(self, obj, context):
        raise NotImplementedError

    def admin_change_context(self, request, obj):
        return ChangeContext(
            actor=request.user,
            organization=self.get_change_organization(obj),
            source=ChangeRecord.Source.SYSTEM,
        )

    def stored_snapshot(self, obj):
        if obj is None or obj._state.adding:
            return None
        return snapshot(type(obj)._default_manager.get(pk=obj.pk))

    def get_form(self, request, obj=None, **kwargs):
        form_class = super().get_form(request, obj, **kwargs)
        model_admin = self

        class ServiceValidatedForm(form_class):
            def _post_clean(self):
                super()._post_clean()
                if self._errors:
                    return
                try:
                    model_admin.prepare(
                        self.instance,
                        model_admin.admin_change_context(request, self.instance),
                        model_admin.stored_snapshot(self.instance),
                    )
                except APIException as exc:
                    for field, messages in api_error_messages(exc.detail).items():
                        for message in messages:
                            self.add_error(
                                field if field in self.fields else None, message
                            )

        return ServiceValidatedForm

    def save_model(self, request, obj, form, change):
        self.commit(
            obj, self.admin_change_context(request, obj), self.stored_snapshot(obj)
        )

    def delete_model(self, request, obj):
        self.remove(obj, self.admin_change_context(request, obj))

    def delete_queryset(self, request, queryset):
        for obj in queryset:
            self.delete_model(request, obj)
