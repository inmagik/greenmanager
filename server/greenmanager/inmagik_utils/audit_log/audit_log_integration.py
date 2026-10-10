from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.db.models import CharField, Manager, OuterRef, Subquery
from django.db.models.functions import Cast, Coalesce
from django.db.utils import ProgrammingError


class LastUpdateMixin:
    def _get_logentry_qs(self, **kwargs):
        try:
            # object_pk holds the key as text for every model; object_id only
            # for integer keys (the domain entities have UUID keys, D-014).
            return LogEntry.objects.filter(
                content_type_id=ContentType.objects.get_for_model(self.model).id,
                object_pk=Cast(OuterRef("pk"), output_field=CharField()),
                **kwargs,
            ).order_by("-timestamp")
        except ProgrammingError:
            # This can happen if the logentry table (or the ContentType table)
            # doesn't exist yet, e.g. during initial migrations.
            return LogEntry.objects.none()

    def get_queryset(self):
        update_qs = self._get_logentry_qs(action=LogEntry.Action.UPDATE)
        create_qs = self._get_logentry_qs(action=LogEntry.Action.CREATE)
        return (
            super()
            .get_queryset()
            .annotate(
                _raw_updated_at=Subquery(update_qs.values("timestamp")[:1]),
                created_at=Subquery(create_qs.values("timestamp")[:1]),
                updated_at=Coalesce("_raw_updated_at", "created_at"),
                _raw_updated_by_email=Subquery(update_qs.values("actor_email")[:1]),
                created_by_email=Subquery(create_qs.values("actor_email")[:1]),
                updated_by_email=Coalesce("_raw_updated_by_email", "created_by_email"),
            )
        )


def standard_auditlog_manager():
    return type("AuditlogManager", (LastUpdateMixin, Manager), {})
