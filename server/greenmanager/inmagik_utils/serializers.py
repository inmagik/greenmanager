from django.core.exceptions import ValidationError
from rest_framework import serializers


class FullCleanValidatorSerializerMixin:
    def validate(self, attrs):
        """
        Build the record as it will be after the REST call and validate it with
        the model ``full_clean`` method, so that the rules in ``clean()`` and the
        model constraints apply to the API too.
        """
        request = self.context.get("request", None)
        instance = None

        if request and request.method in ["POST", "PUT", "PATCH"]:
            instance = getattr(self, "instance", None)
            if instance is None:
                instance = self.Meta.model(**attrs)
            else:
                for attr, value in attrs.items():
                    setattr(instance, attr, value)
            try:
                instance.full_clean()
            except ValidationError as e:
                raise serializers.ValidationError(e.message_dict)

        return super().validate(attrs)
