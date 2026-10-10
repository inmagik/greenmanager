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


def add_api_errors(form, exc):
    """Show the errors of an API exception on a Django form."""
    for field, messages in api_error_messages(exc.detail).items():
        for message in messages:
            form.add_error(field if field in form.fields else None, message)


class ServiceAdminMixin:
    """
    Admin of a domain model whose changes go through its services, with the same
    rules as the API: the form shows the errors of the rules, saving and deleting
    call the services.

    The subclass implements, with ``stored`` the record as saved (``None`` for a
    new one):
    - ``prepare(request, obj, stored)``: rules and derived values, without saving;
      it raises the API errors, which the form shows;
    - ``commit(request, obj, stored)``: saves the prepared record;
    - ``remove(request, obj)``: deletes the record.
    """

    def prepare(self, request, obj, stored):
        raise NotImplementedError

    def commit(self, request, obj, stored):
        raise NotImplementedError

    def remove(self, request, obj):
        raise NotImplementedError

    def stored_instance(self, obj):
        if obj is None or obj._state.adding:
            return None
        return type(obj)._default_manager.get(pk=obj.pk)

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
                        request,
                        self.instance,
                        model_admin.stored_instance(self.instance),
                    )
                except APIException as exc:
                    add_api_errors(self, exc)

        return ServiceValidatedForm

    def save_model(self, request, obj, form, change):
        self.commit(request, obj, self.stored_instance(obj))

    def delete_model(self, request, obj):
        self.remove(request, obj)

    def delete_queryset(self, request, queryset):
        for obj in queryset:
            self.delete_model(request, obj)


class ServiceBackedAdminMixin(ServiceAdminMixin):
    """
    Admin of the operational data: the services also write the ChangeRecord, with
    source ``system`` and the organization of ``get_change_organization(obj)``.

    The subclass implements ``prepare_change(obj, context, before)``,
    ``commit_change(obj, context, before)`` and ``remove_change(obj, context)``,
    with ``before`` the snapshot of the stored record.
    """

    def get_change_organization(self, obj):
        raise NotImplementedError

    def prepare_change(self, obj, context, before):
        raise NotImplementedError

    def commit_change(self, obj, context, before):
        raise NotImplementedError

    def remove_change(self, obj, context):
        raise NotImplementedError

    def admin_change_context(self, request, obj):
        return ChangeContext(
            actor=request.user,
            organization=self.get_change_organization(obj),
            source=ChangeRecord.Source.SYSTEM,
        )

    def prepare(self, request, obj, stored):
        self.prepare_change(
            obj,
            self.admin_change_context(request, obj),
            snapshot(stored) if stored is not None else None,
        )

    def commit(self, request, obj, stored):
        self.commit_change(
            obj,
            self.admin_change_context(request, obj),
            snapshot(stored) if stored is not None else None,
        )

    def remove(self, request, obj):
        self.remove_change(obj, self.admin_change_context(request, obj))
