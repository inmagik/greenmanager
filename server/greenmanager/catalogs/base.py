"""
Abstract models of the catalogs (§2.1–2.2 of 04-modello-dati.md, D-016, D-027).

- Extensible catalogs: system entries (no organization) plus the entries each
  organization adds; an organization hides the system entries it does not use.
- Fixed catalogs: system entries only, from an external source (ISTAT, CAM).

Both use the same QuerySet methods, so views and services treat them alike:
``system()``, ``visible_to(org)``, ``available_for(org)``, ``with_flags(org)``.
"""

from core.models import TrackedModel
from django.db import models
from django.db.models import (
    BooleanField,
    Exists,
    ExpressionWrapper,
    OuterRef,
    Q,
    Value,
)

CODE_NOT_UNIQUE = "catalog_code_not_unique"


class CatalogQuerySet(models.QuerySet):
    """QuerySet of an extensible catalog."""

    def system(self):
        return self.filter(organization__isnull=True)

    def visible_to(self, organization):
        """System entries and the entries of the organization, retired too."""
        if organization is None:
            return self.system()
        return self.filter(Q(organization__isnull=True) | Q(organization=organization))

    def available_for(self, organization):
        """Entries an organization can pick: system entries neither retired nor
        hidden by it, and its own entries not retired."""
        qs = self.filter(retired=False)
        if organization is None:
            return qs.system()
        return qs.filter(
            Q(organization=organization)
            | (Q(organization__isnull=True) & ~Q(hidden_by=organization))
        )

    def with_flags(self, organization):
        """Annotate ``is_hidden`` (the organization hides the system entry) and
        ``is_available`` (the organization can pick the entry)."""
        if organization is None:
            is_hidden = Value(False, output_field=BooleanField())
        else:
            field = self.model._meta.get_field("hidden_by")
            is_hidden = Exists(
                field.remote_field.through.objects.filter(
                    **{
                        field.m2m_field_name(): OuterRef("pk"),
                        field.m2m_reverse_field_name(): organization,
                    }
                )
            )
        # Explicit about NULL: a system entry is not "own" (NULL = x is NULL in SQL).
        own = (
            Q(organization__isnull=False, organization=organization)
            if organization is not None
            else Q(pk=None)
        )
        return self.annotate(is_hidden=is_hidden).annotate(
            is_available=ExpressionWrapper(
                Q(retired=False)
                & (own | (Q(organization__isnull=True) & Q(is_hidden=False))),
                output_field=BooleanField(),
            )
        )


class FixedCatalogQuerySet(models.QuerySet):
    """QuerySet of a fixed catalog: every entry is a system entry."""

    def system(self):
        return self.all()

    def visible_to(self, organization):
        return self.all()

    def available_for(self, organization):
        return self.filter(retired=False)

    def with_flags(self, organization):
        return self.annotate(
            is_hidden=Value(False, output_field=BooleanField()),
            is_available=ExpressionWrapper(
                Q(retired=False), output_field=BooleanField()
            ),
        )


class CatalogEntry(TrackedModel):
    code = models.CharField(
        "codice",
        max_length=150,
        help_text="Codice stabile, usato da import, export e dati iniziali.",
    )
    name = models.CharField("nome", max_length=255)
    description = models.TextField("descrizione", blank=True, default="")
    sort_order = models.IntegerField("ordine", default=0)
    source = models.CharField("fonte", max_length=255, blank=True, default="")
    retired = models.BooleanField(
        "ritirata",
        default=False,
        help_text="Non si sceglie più, ma resta valida sui dati che la usano.",
    )

    # Errors of the constraints shown on a field (core.errors.validate_model).
    constraint_error_fields = {CODE_NOT_UNIQUE: "code"}
    # Fields that cannot change once the entry is in use.
    locked_when_in_use = ()

    class Meta:
        abstract = True
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class FixedCatalog(CatalogEntry):
    is_extensible = False
    # Not fields: a fixed catalog has system entries only.
    organization = None
    organization_id = None

    objects = FixedCatalogQuerySet.as_manager()

    class Meta(CatalogEntry.Meta):
        abstract = True
        constraints = [
            models.UniqueConstraint(
                fields=["code"],
                name="%(app_label)s_%(class)s_code_uniq",
                violation_error_code=CODE_NOT_UNIQUE,
                violation_error_message="An entry with this code already exists.",
            ),
        ]

    @property
    def is_system(self):
        return True


class ExtensibleCatalog(CatalogEntry):
    is_extensible = True
    # Whether organizations add entries; some catalogs get them only in v2.
    organization_entries_allowed = True

    organization = models.ForeignKey(
        "tenants.Tenant",
        verbose_name="organizzazione",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="%(app_label)s_%(class)s_set",
        help_text="Vuota per le voci di sistema.",
    )
    hidden_by = models.ManyToManyField(
        "tenants.Tenant",
        verbose_name="nascosta da",
        blank=True,
        related_name="+",
        help_text="Organizzazioni che nascondono la voce di sistema.",
    )

    objects = CatalogQuerySet.as_manager()

    class Meta(CatalogEntry.Meta):
        abstract = True
        constraints = [
            # The code is unique among the system entries and, for each
            # organization, among its entries.
            models.UniqueConstraint(
                fields=["organization", "code"],
                nulls_distinct=False,
                name="%(app_label)s_%(class)s_code_uniq",
                violation_error_code=CODE_NOT_UNIQUE,
                violation_error_message="An entry with this code already exists.",
            ),
        ]

    @property
    def is_system(self):
        return self.organization_id is None
