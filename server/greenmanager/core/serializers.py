from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .services import user_label


class TrackedModelSerializer(serializers.ModelSerializer):
    """
    Base serializer of the models with the tracking fields (TrackedModel).

    - The labels of the authors feed the "last change" details of the detail
      pages: the views select ``created_by`` and ``updated_by`` with the record.
    - ``revision`` is the current revision; in a change, the client can send back
      the revision it read: if the record changed in the meantime the API answers
      409 ``revision_conflict``. The views take it out of the validated data
      (``pop_revision``).
    """

    created_by_label = serializers.SerializerMethodField()
    updated_by_label = serializers.SerializerMethodField()
    revision = serializers.IntegerField(required=False, min_value=1)

    tracking_fields = (
        "created_at",
        "created_by_label",
        "updated_at",
        "updated_by_label",
        "revision",
    )

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by_label(self, obj):
        return user_label(obj.created_by) or None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_updated_by_label(self, obj):
        return user_label(obj.updated_by) or None


def pop_revision(validated_data):
    """The revision the client read, out of the data to save."""
    return validated_data.pop("revision", None)
