from auditlog.registry import auditlog

from .models import TRACKING_FIELDS


def register_audit(model, exclude_fields=(), **kwargs):
    """Register a domain model with django-auditlog.

    The tracking fields of TrackedModel are not changes of the record: they stay
    out of the technical history. (``AUDITLOG_EXCLUDE_TRACKING_FIELDS`` would need
    every model of the project to be registered.)
    """
    auditlog.register(
        model, exclude_fields=[*TRACKING_FIELDS, *exclude_fields], **kwargs
    )
