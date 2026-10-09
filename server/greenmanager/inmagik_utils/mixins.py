from django.db import transaction
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response


class BulkDeleteActionMixin:
    """
    Mixin to add a bulk delete action to a viewset.
    """

    @action(detail=False, methods=["POST"], url_path="bulk-delete")
    @transaction.atomic
    def bulk_delete(self, request, *args, **kwargs):

        ser_class = type(
            "BulkDeleteSerializer",
            (serializers.Serializer,),
            {
                "ids": serializers.ListField(
                    child=serializers.PrimaryKeyRelatedField(
                        queryset=self.get_queryset()
                    )
                )
            },
        )
        ser = ser_class(data=request.data)
        ser.is_valid(raise_exception=True)

        for instance in ser.validated_data["ids"]:
            instance.delete()
        return Response(status=204)
