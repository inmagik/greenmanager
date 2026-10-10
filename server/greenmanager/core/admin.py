from django import forms
from django.contrib import admin, messages
from django.core.exceptions import NON_FIELD_ERRORS
from django.db import router, transaction
from django.http import HttpResponseRedirect
from rest_framework.exceptions import APIException

from .errors import check_revision
from .models import ChangeRecord
from .services import ChangeContext, snapshot

EXPECTED_REVISION = "expected_revision"


class DeletionRefused(Exception):
    """A service refused a deletion from the admin: the view rolls back and
    reports it."""

    def __init__(self, api_exception):
        super().__init__(str(api_exception))
        self.api_exception = api_exception


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
    for field, field_messages in api_error_messages(exc.detail).items():
        for message in field_messages:
            form.add_error(field if field in form.fields else None, message)


class ServiceAdminMixin:
    """
    Admin of a domain model whose changes go through its services, with the same
    rules as the API: the form shows the errors of the rules, saving and deleting
    call the services.

    A change locks the stored record until the end of the request (the admin
    saves in a transaction) and, for the models with a revision, checks that it
    is still the one the form was opened with (``revision_conflict``).

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

    def lock_stored(self, obj):
        """The record as saved, locked; ``None`` for a new record."""
        if obj is None or obj._state.adding:
            return None
        return type(obj)._default_manager.select_for_update().get(pk=obj.pk)

    def get_form(self, request, obj=None, **kwargs):
        # The revision field belongs to the form below, not to the model.
        if kwargs.get("fields"):
            kwargs["fields"] = [
                field for field in kwargs["fields"] if field != EXPECTED_REVISION
            ]
        form_class = super().get_form(request, obj, **kwargs)
        model_admin = self
        has_revision = any(
            field.name == "revision" for field in self.model._meta.concrete_fields
        )

        class ServiceValidatedForm(form_class):
            if has_revision:
                # The revision the form was opened with.
                expected_revision = forms.IntegerField(
                    required=False, widget=forms.HiddenInput
                )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                if has_revision and not self.instance._state.adding:
                    self.fields[EXPECTED_REVISION].initial = self.instance.revision

            def _post_clean(self):
                super()._post_clean()
                self.stored = None
                if self._errors:
                    return
                try:
                    self.stored = model_admin.lock_stored(self.instance)
                    if has_revision and self.stored is not None:
                        check_revision(
                            self.stored, self.cleaned_data.get(EXPECTED_REVISION)
                        )
                        # The save counts from the locked revision.
                        self.instance.revision = self.stored.revision
                    model_admin.prepare(request, self.instance, self.stored)
                except APIException as exc:
                    add_api_errors(self, exc)

        return ServiceValidatedForm

    def save_model(self, request, obj, form, change):
        stored = getattr(form, "stored", None)
        if change and stored is None:
            stored = self.lock_stored(obj)
        self.commit(request, obj, stored)

    def delete_model(self, request, obj):
        try:
            self.remove(request, obj)
        except APIException as exc:
            raise DeletionRefused(exc) from exc

    def delete_queryset(self, request, queryset):
        for obj in queryset:
            self.delete_model(request, obj)

    def refuse_deletion(self, request, exc, redirect_to):
        """Report a deletion the services refused: nothing was deleted."""
        for messages_of_field in api_error_messages(exc.api_exception.detail).values():
            for message in messages_of_field:
                self.message_user(request, message, messages.ERROR)
        return HttpResponseRedirect(redirect_to)

    def delete_view(self, request, object_id, extra_context=None):
        try:
            with transaction.atomic(using=router.db_for_write(self.model)):
                return super().delete_view(request, object_id, extra_context)
        except DeletionRefused as exc:
            return self.refuse_deletion(request, exc, request.path)

    def changelist_view(self, request, extra_context=None):
        # The bulk deletion is an action of the list: all the records, or none.
        try:
            with transaction.atomic(using=router.db_for_write(self.model)):
                return super().changelist_view(request, extra_context)
        except DeletionRefused as exc:
            return self.refuse_deletion(request, exc, request.get_full_path())


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
