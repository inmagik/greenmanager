from rest_framework import serializers


class AuditLogChangeSerializer(serializers.Serializer):
    field = serializers.CharField()
    old = serializers.CharField(allow_null=True)
    new = serializers.CharField(allow_null=True)


class AuditLogEntrySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    action = serializers.SerializerMethodField()
    actor = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(read_only=True)
    changes = serializers.SerializerMethodField()

    def get_action(self, obj):
        return obj.get_action_display()

    def get_actor(self, obj):
        if obj.actor is not None:
            return getattr(obj.actor, "full_name", "") or obj.actor.get_username()
        return obj.actor_email or "Sistema"

    def get_changes(self, obj):
        changes = []
        for field, values in obj.changes_display_dict.items():
            old, new = values if len(values) == 2 else (None, None)
            changes.append(
                {
                    "field": str(field),
                    "old": None if old is None else str(old),
                    "new": None if new is None else str(new),
                }
            )
        return AuditLogChangeSerializer(changes, many=True).data


class AuditLogFields(metaclass=serializers.SerializerMetaclass):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    created_by_email = serializers.EmailField(read_only=True)
    updated_by_email = serializers.EmailField(read_only=True)
