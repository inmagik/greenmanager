from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response

_bulk_delete_serializers = {}


def bulk_delete_serializer_class(model):
    """Serializer of ``{"ids": [...]}``, one class per model (one schema component).

    The ids are looked up in the queryset of the view, so a request can only
    delete the records it can see.
    """
    if model not in _bulk_delete_serializers:

        class BulkDeleteSerializer(serializers.Serializer):
            ids = serializers.ListField(
                child=serializers.PrimaryKeyRelatedField(queryset=model.objects.none())
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                view = self.context.get("view")
                # drf-spectacular builds the schema with a fake view and no user.
                if view is not None and not getattr(view, "swagger_fake_view", False):
                    self.fields["ids"].child.queryset = view.get_queryset()

        BulkDeleteSerializer.__name__ = f"{model.__name__}BulkDelete"
        _bulk_delete_serializers[model] = BulkDeleteSerializer
    return _bulk_delete_serializers[model]


class BulkDeleteActionMixin:
    """
    Mixin to add a bulk delete action to a viewset.
    """

    def get_serializer_class(self):
        if getattr(self, "action", None) == "bulk_delete":
            return bulk_delete_serializer_class(self.queryset.model)
        return super().get_serializer_class()

    @extend_schema(responses={204: None})
    @action(detail=False, methods=["POST"], url_path="bulk-delete")
    @transaction.atomic
    def bulk_delete(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)

        # Same path as the single deletion, so that the rules of the viewset apply.
        for instance in ser.validated_data["ids"]:
            self.perform_destroy(instance)
        return Response(status=204)
