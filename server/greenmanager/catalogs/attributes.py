"""
Values of the class attributes of an element (EL-3), validated against the
attributes of its class (``ElementClassAttribute``).

Each error has a code the frontend translates, under ``attributes.<code>``:
``attribute_unknown``, ``attribute_is_measure``, ``attribute_retired``,
``attribute_required``, ``attribute_invalid_type`` (params ``expected``),
``attribute_invalid_choice`` (params ``choices``).
"""

import datetime

from core.errors import error_payload
from rest_framework import serializers

from .models import AttributeDefinition

DataType = AttributeDefinition.DataType
MAX_TEXT_LENGTH = 1000


class AttributeValueError(Exception):
    def __init__(self, code, detail, params=None):
        super().__init__(detail)
        self.payload = error_payload(code, detail, params)


def invalid_type(expected):
    return AttributeValueError(
        "attribute_invalid_type",
        f"The value must be of type {expected}.",
        {"expected": expected},
    )


def coerce(attribute, value):
    """The value of ``attribute`` as stored in ``Element.attributes``."""
    data_type = attribute.data_type
    if data_type == DataType.NUMBER:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise invalid_type(DataType.NUMBER)
        return value
    if data_type == DataType.BOOLEAN:
        if not isinstance(value, bool):
            raise invalid_type(DataType.BOOLEAN)
        return value
    if not isinstance(value, str):
        raise invalid_type(data_type)
    value = value.strip()
    if data_type == DataType.TEXT:
        if len(value) > MAX_TEXT_LENGTH:
            raise AttributeValueError(
                "attribute_too_long",
                "The text is too long.",
                {"max_length": MAX_TEXT_LENGTH},
            )
        return value
    if data_type == DataType.CHOICE:
        if value not in attribute.choices:
            raise AttributeValueError(
                "attribute_invalid_choice",
                "The value is not one of the allowed values.",
                {"choices": ", ".join(attribute.choices)},
            )
        return value
    if data_type == DataType.DATE:
        try:
            return datetime.date.fromisoformat(value).isoformat()
        except ValueError:
            raise invalid_type(DataType.DATE) from None
    raise invalid_type(data_type)


def is_empty(value):
    return value is None or value == ""


def validate_attributes(element_class, values, previous=None):
    """
    The values of the attributes of an element of ``element_class``, cleaned.

    - Keys are the codes of the attributes; empty values are dropped.
    - Measures are not attributes of the element: they go in the observations
      (D-028).
    - Values of attributes no longer in the class, or retired, are kept only if
      unchanged (``previous`` are the values saved on the element).

    Raises a ValidationError ``{"attributes": {<code>: <error>}}``.
    """
    if values is None:
        values = {}
    if not isinstance(values, dict):
        raise serializers.ValidationError(
            {
                "attributes": error_payload(
                    "attributes_invalid", "The attributes must be an object."
                )
            }
        )
    previous = previous or {}
    links = {
        link.attribute.code: link
        for link in element_class.class_attributes.select_related("attribute")
    }

    cleaned, errors = {}, {}
    for key, value in values.items():
        if is_empty(value):
            continue
        link = links.get(key)
        unchanged = key in previous and previous[key] == value
        try:
            if link is None:
                if unchanged:
                    cleaned[key] = value
                    continue
                raise AttributeValueError(
                    "attribute_unknown", "The class has no such attribute."
                )
            attribute = link.attribute
            if attribute.is_measure:
                raise AttributeValueError(
                    "attribute_is_measure",
                    "Measures are recorded in the observations.",
                )
            if attribute.retired and not unchanged:
                raise AttributeValueError(
                    "attribute_retired", "The attribute is no longer in use."
                )
            cleaned[key] = coerce(attribute, value)
        except AttributeValueError as exc:
            errors[key] = exc.payload

    for key, link in links.items():
        attribute = link.attribute
        if (
            link.required
            and not attribute.is_measure
            and not attribute.retired
            and key not in cleaned
            and key not in errors
        ):
            errors[key] = error_payload(
                "attribute_required", "The attribute is required."
            )

    if errors:
        raise serializers.ValidationError({"attributes": errors})
    return cleaned
