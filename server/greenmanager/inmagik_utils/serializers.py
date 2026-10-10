import copy

from django.core.exceptions import ValidationError
from rest_framework import serializers


class FullCleanValidatorSerializerMixin:
    def get_server_assigned_values(self):
        """
        Values that the view sets when it saves, not sent by the client: the
        record must have them to be validated.

        By default the current tenant (``context["tenant"]``, set by
        TenantScopedViewSetMixin) for models with a ``tenant`` field. Override it
        for other values assigned in ``perform_create``.
        """
        tenant = self.context.get("tenant")
        if tenant is not None and has_field(self.Meta.model, "tenant"):
            return {"tenant": tenant}
        return {}

    def validate(self, attrs):
        """
        Build the record as it will be after the REST call and validate it with
        the model ``full_clean`` method, so that the rules in ``clean()`` and the
        model constraints apply to the API too.
        """
        request = self.context.get("request", None)

        if request and request.method in ["POST", "PUT", "PATCH"]:
            model = self.Meta.model
            # Many-to-many values are not attributes of the record.
            many_to_many = {field.name for field in model._meta.many_to_many}
            values = {
                attr: value for attr, value in attrs.items() if attr not in many_to_many
            }
            if self.instance is None:
                instance = model(**{**self.get_server_assigned_values(), **values})
            else:
                # A copy: the record changes only when the serializer saves it.
                instance = copy.copy(self.instance)
                for attr, value in values.items():
                    setattr(instance, attr, value)
            # Without a tenant the view answers with its own error (tenant_required).
            exclude = (
                ["tenant"]
                if has_field(model, "tenant") and instance.tenant_id is None
                else None
            )
            try:
                instance.full_clean(exclude=exclude)
            except ValidationError as e:
                raise serializers.ValidationError(e.message_dict)

        return super().validate(attrs)


def has_field(model, name):
    return any(field.name == name for field in model._meta.concrete_fields)
