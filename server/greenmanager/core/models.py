import uuid

from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.utils import timezone

# Namespace of the keys of the system catalog entries: the same entry has the same
# key in every installation (see system_entry_id). Never change it.
SYSTEM_ENTRY_NAMESPACE = uuid.UUID("5d0f2a3c-7e5b-4c1d-9a8e-2b6f4c3d1e90")

# Fields of TrackedModel: they are not part of the history of a record.
TRACKING_FIELDS = ("created_at", "created_by", "updated_at", "updated_by", "revision")


def system_entry_id(model_label, code):
    """Deterministic key of a system entry, e.g. ``("catalogs.species", "acer")``."""
    return uuid.uuid5(SYSTEM_ENTRY_NAMESPACE, f"{model_label.lower()}:{code}")


class UUIDModel(models.Model):
    """UUID key, which a device in the field can also generate (D-014)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TrackedModel(UUIDModel):
    """
    Common fields of the domain entities (§3.1 of 04-modello-dati.md).

    ``revision`` grows at every save of an existing record: the domain services
    lock the record before changing it, so two changes never share a revision.
    Author fields are set by the services (``core.services.stamp``).
    """

    created_at = models.DateTimeField("creato il", auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="creato da",
        null=True,
        blank=True,
        editable=False,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    updated_at = models.DateTimeField("modificato il", auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="modificato da",
        null=True,
        blank=True,
        editable=False,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    revision = models.PositiveIntegerField("revisione", default=1, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self._state.adding:
            self.revision += 1
            update_fields = kwargs.get("update_fields")
            if update_fields is not None:
                kwargs["update_fields"] = {
                    *update_fields,
                    "revision",
                    "updated_at",
                    "updated_by",
                }
        super().save(*args, **kwargs)


class ChangeRecordQuerySet(models.QuerySet):
    """The history is not changed or deleted in bulk either. A trigger in the
    database enforces it for every writer (migration 0002)."""

    def update(self, **kwargs):
        raise ValueError("The history of the changes cannot be changed.")

    def delete(self):
        raise ValueError("The history of the changes cannot be deleted.")


class ChangeRecord(UUIDModel):
    """
    Domain history of the operational data (TR-6, CE-4; D-034).

    Written by the domain services, never changed or deleted. django-auditlog
    keeps the technical history of every model besides it.
    """

    class Operation(models.TextChoices):
        CREATE = "create", "Creazione"
        UPDATE = "update", "Modifica"
        CANCEL = "cancel", "Annullamento"

    class Source(models.TextChoices):
        WEB = "web", "Web"
        FIELD = "field", "Campo"
        IMPORT = "import", "Import"
        SYNC = "sync", "Sincronizzazione"
        SYSTEM = "system", "Sistema"

    entity = models.CharField("entità", max_length=100)
    record_id = models.UUIDField("record")
    # A plain value, not a foreign key: the history outlives the records, and
    # core does not depend on the domain apps.
    client_id = models.UUIDField("committente", null=True, blank=True)
    operation = models.CharField("operazione", max_length=20, choices=Operation.choices)
    changes = models.JSONField("modifiche", encoder=DjangoJSONEncoder)
    reason = models.TextField("motivazione", blank=True, default="")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="autore",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    # The name of the author when the change was made: it stays if the user is
    # deleted.
    author_label = models.CharField("nome dell'autore", max_length=255, blank=True)
    organization = models.ForeignKey(
        "tenants.Tenant",
        verbose_name="organizzazione",
        on_delete=models.PROTECT,
        related_name="change_records",
    )
    recorded_at = models.DateTimeField("registrata il", default=timezone.now)
    source = models.CharField("origine", max_length=20, choices=Source.choices)

    objects = ChangeRecordQuerySet.as_manager()

    class Meta:
        verbose_name = "modifica"
        verbose_name_plural = "storico delle modifiche"
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["entity", "record_id"], name="core_change_record_idx"),
            models.Index(
                fields=["client_id", "recorded_at"], name="core_change_client_idx"
            ),
            models.Index(
                fields=["organization", "recorded_at"],
                name="core_change_org_idx",
            ),
        ]

    def __str__(self):
        return f"{self.entity} {self.record_id} · {self.operation}"

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValueError("The history of the changes cannot be changed.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("The history of the changes cannot be deleted.")
