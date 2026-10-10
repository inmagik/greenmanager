from core.audit import register_audit
from core.models import TrackedModel
from django.core.validators import RegexValidator
from django.db import models

# The CAM data model has 5 characters for the ISTAT code, the municipalities have
# 6 digits: both are accepted until the export is checked (Step 5).
istat_code_validator = RegexValidator(
    r"^\d{5,6}$",
    message="The ISTAT code has 5 or 6 digits.",
    code="invalid_istat_code",
)


class ClientQuerySet(models.QuerySet):
    """Access to the clients (§5.4 of 04-modello-dati.md).

    In the MVP an organization sees and changes the clients it manages.
    """

    def visible_to(self, organization):
        if organization is None:
            return self.none()
        return self.filter(managing_organization=organization)

    def editable_by(self, organization):
        return self.visible_to(organization)


class Client(TrackedModel):
    """Who owns or holds the green assets (A1, D-013), managed by an organization
    (D-032)."""

    class Kind(models.TextChoices):
        PUBLIC_BODY = "public_body", "Ente pubblico"
        PUBLIC_COMPANY = "public_company", "Azienda pubblica"
        CONDOMINIUM = "condominium", "Condominio"
        COMPANY = "company", "Azienda"
        PRIVATE = "private", "Privato"
        OTHER = "other", "Altro"

    class CamExportSrid(models.IntegerChoices):
        RDN2008_GEOGRAPHIC = 6706, "RDN2008 geografico (EPSG:6706)"
        RDN2008_UTM32 = 7791, "RDN2008 / UTM 32N (EPSG:7791)"
        RDN2008_UTM33 = 7792, "RDN2008 / UTM 33N (EPSG:7792)"
        RDN2008_UTM34 = 7793, "RDN2008 / UTM 34N (EPSG:7793)"
        RDN2008_ITALY = 7794, "RDN2008 / Italy zone (EPSG:7794)"

    name = models.CharField("denominazione", max_length=255)
    kind = models.CharField("tipo", max_length=20, choices=Kind.choices)
    istat_code = models.CharField(
        "codice ISTAT del comune",
        max_length=6,
        blank=True,
        default="",
        validators=[istat_code_validator],
    )
    tax_code = models.CharField(
        "codice fiscale o partita IVA", max_length=16, blank=True, default=""
    )
    managing_organization = models.ForeignKey(
        "tenants.Tenant",
        verbose_name="organizzazione di gestione",
        on_delete=models.PROTECT,
        related_name="managed_clients",
    )
    contacts = models.TextField("recapiti", blank=True, default="")
    cam_export_srid = models.PositiveIntegerField(
        "sistema di riferimento per l'export CAM",
        choices=CamExportSrid.choices,
        null=True,
        blank=True,
    )
    active = models.BooleanField("attivo", default=True)
    notes = models.TextField("note", blank=True, default="")

    objects = ClientQuerySet.as_manager()

    class Meta:
        verbose_name = "committente"
        verbose_name_plural = "committenti"
        ordering = ["name"]
        indexes = [
            models.Index(
                fields=["managing_organization", "active"],
                name="parties_client_org_idx",
            ),
        ]

    def __str__(self):
        return self.name


register_audit(Client)
