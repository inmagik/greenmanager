"""
Errors of the API in the ``{"code", "params", "detail"}`` shape (§4.3 of backend.md).

``code`` is stable and the frontend translates it (``serverErrors.<code>``) with
``params``; ``detail`` is in English, for the API and the logs.
"""

from django.core.exceptions import NON_FIELD_ERRORS
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import exceptions, serializers


def error_payload(code, detail, params=None):
    payload = {"code": code, "detail": detail}
    if params:
        payload["params"] = {key: str(value) for key, value in params.items()}
    return payload


def api_error(code, detail, params=None, field=None):
    """ValidationError (400) with one error, of a field or of the whole request."""
    payload = error_payload(code, detail, params)
    return serializers.ValidationError({field: payload} if field else payload)


def permission_error(code, detail, params=None):
    """PermissionDenied (403) with a code."""
    return exceptions.PermissionDenied(error_payload(code, detail, params))


class Conflict(exceptions.APIException):
    status_code = 409
    default_detail = "The record was changed in the meantime."
    default_code = "conflict"


def check_revision(instance, expected):
    """Optimistic concurrency: the client sends the revision it changed.

    ``None`` skips the check. Call it on the locked record.
    """
    if expected is not None and expected != instance.revision:
        raise Conflict(
            error_payload(
                "revision_conflict",
                "The record was changed by someone else in the meantime.",
                {"expected": expected, "current": instance.revision},
            )
        )


def _django_error_payload(error):
    params = error.params or {}
    message = error.message % params if params else error.message
    return error_payload(error.code or "invalid", str(message), params)


def django_errors_payload(exc, model=None):
    """
    Errors of a Django ValidationError in the API shape, keeping code and params.

    Errors of the whole record (constraints, ``clean()``) go under
    ``non_field_errors``, or under the field that ``model.constraint_error_fields``
    maps their code to (e.g. ``{"catalog_code_not_unique": "code"}``).
    """
    if not hasattr(exc, "error_dict"):
        errors = [_django_error_payload(error) for error in exc.error_list]
        return errors[0] if len(errors) == 1 else errors
    field_map = getattr(model, "constraint_error_fields", {}) if model else {}
    payload = {}
    for field, errors in exc.error_dict.items():
        for error in errors:
            item = _django_error_payload(error)
            key = field
            if field == NON_FIELD_ERRORS:
                key = field_map.get(item["code"], "non_field_errors")
            payload.setdefault(key, []).append(item)
    return payload


def validate_model(instance, exclude=None):
    """``full_clean()`` of the record, with the errors in the API shape.

    Unlike ``FullCleanValidatorSerializerMixin`` it keeps the codes of the errors,
    which the frontend translates.
    """
    try:
        instance.full_clean(exclude=exclude)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(django_errors_payload(exc, type(instance)))
