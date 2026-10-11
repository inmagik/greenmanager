from datetime import date

from core.audit import register_audit
from core.models import TrackedModel
from django.contrib.gis.db import models
from django.db.models import BooleanField, Exists, F, Func, OuterRef, Q, Value
from django.db.models.functions import Coalesce
from django.db.models.lookups import Exact
from parties.models import ClientDataQuerySet, istat_code_validator

# Interiors that intersect: two areas that only touch do not overlap.
OVERLAP_PATTERN = "T********"


class Zone(TrackedModel):
    """Optional group of areas of a client (D-019): a district, a complex. The
    ``ZONA`` field of the CAM data model."""

    client = models.ForeignKey(
        "parties.Client",
        verbose_name="committente",
        on_delete=models.PROTECT,
        related_name="zones",
    )
    # Not null once saved: without it, the services give the next one.
    code = models.PositiveIntegerField(
        "codice",
        blank=True,
        help_text="Numerico, univoco per committente (campo ZONA del CAM). Se "
        "manca, il successivo.",
    )
    name = models.CharField("nome", max_length=255)
    geometry = models.MultiPolygonField(
        "perimetro",
        srid=4326,
        null=True,
        blank=True,
        help_text="Perimetro ufficiale, se esiste (es. un municipio).",
    )

    objects = ClientDataQuerySet.as_manager()

    constraint_error_fields = {"zone_code_not_unique": "code"}

    class Meta:
        verbose_name = "zona"
        verbose_name_plural = "zone"
        ordering = ["client", "code"]
        constraints = [
            models.UniqueConstraint(
                fields=["client", "code"],
                name="territory_zone_code_uniq",
                violation_error_code="zone_code_not_unique",
                violation_error_message="A zone with this code already exists.",
            ),
        ]

    def __str__(self):
        return f"{self.code} {self.name}"


def relate(geometry, other, pattern):
    """``ST_Relate`` of two geometry expressions, as a condition."""
    return Func(
        geometry,
        other,
        Value(pattern),
        function="ST_Relate",
        output_field=BooleanField(),
    )


class AreaQuerySet(ClientDataQuerySet):
    def managed_on(self, date):
        """Areas managed on ``date``."""
        return self.filter(management_start__lte=date).filter(
            Q(management_end__isnull=True) | Q(management_end__gte=date)
        )

    def overlapping(self, client_id, geometry, start, end=None):
        """
        Areas of the client that overlap ``geometry`` and are managed in the
        period from ``start`` to ``end`` (``None``: open). Fictitious areas do
        not count: they are not managed surfaces (AR-3).
        """
        areas = self.filter(
            client_id=client_id,
            is_fictitious=False,
            geometry__intersects=geometry,
            geometry__relate=(geometry, OVERLAP_PATTERN),
        ).filter(Q(management_end__isnull=True) | Q(management_end__gte=start))
        if end is not None:
            areas = areas.filter(management_start__lte=end)
        return areas

    def with_overlap_flag(self):
        """Annotate ``has_overlaps``: the area overlaps another one of the client
        managed in the same period (AR-5), as in ``overlapping``."""
        others = (
            Area.objects.filter(
                Exact(OuterRef("is_fictitious"), False),
                client=OuterRef("client"),
                is_fictitious=False,
                geometry__intersects=OuterRef("geometry"),
                management_start__lte=Coalesce(
                    OuterRef("management_end"), Value(date.max)
                ),
            )
            .filter(
                Q(management_end__isnull=True)
                | Q(management_end__gte=OuterRef("management_start"))
            )
            .filter(relate(F("geometry"), OuterRef("geometry"), OVERLAP_PATTERN))
            .exclude(pk=OuterRef("pk"))
        )
        return self.annotate(has_overlaps=Exists(others))


class Area(TrackedModel):
    """Managed piece of land with its perimeter (AR-1): the management area of the
    CAM data model (``S325xxx`` objects)."""

    class CensusLevel(models.IntegerChoices):
        LEVEL_1 = 1, "Livello 1"
        LEVEL_2 = 2, "Livello 2"
        LEVEL_3 = 3, "Livello 3"

    client = models.ForeignKey(
        "parties.Client",
        verbose_name="committente",
        on_delete=models.PROTECT,
        related_name="areas",
    )
    zone = models.ForeignKey(
        Zone,
        verbose_name="zona",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="areas",
    )
    number = models.CharField("numero", max_length=20)
    sub_number = models.CharField("subalterno", max_length=20, blank=True, default="")
    name = models.CharField("nome", max_length=255)
    geometry = models.MultiPolygonField("perimetro", srid=4326)
    # Computed from the geometry by the services, on the ellipsoid.
    surface_m2 = models.DecimalField(
        "superficie (m²)", max_digits=14, decimal_places=2, default=0, editable=False
    )
    perimeter_m = models.DecimalField(
        "perimetro (m)", max_digits=12, decimal_places=2, default=0, editable=False
    )
    is_fictitious = models.BooleanField(
        "area fittizia",
        default=False,
        help_text="Non è una superficie gestita: esclusa dalle superfici e dai "
        "controlli delle sovrapposizioni.",
    )
    urban_green_type = models.ForeignKey(
        "catalogs.UrbanGreenType",
        verbose_name="tipologia ISTAT",
        on_delete=models.PROTECT,
        related_name="areas",
    )
    area_use = models.ForeignKey(
        "catalogs.AreaUse",
        verbose_name="destinazione d'uso",
        on_delete=models.PROTECT,
        related_name="areas",
    )
    usage_intensity = models.ForeignKey(
        "catalogs.UsageIntensity",
        verbose_name="intensità di fruizione",
        on_delete=models.PROTECT,
        related_name="areas",
    )
    management_start = models.DateField("inizio della gestione")
    management_end = models.DateField("fine della gestione", null=True, blank=True)
    # Required once saved: without it, the services take the one of the client.
    municipality_code = models.CharField(
        "codice ISTAT del comune",
        max_length=6,
        blank=True,
        validators=[istat_code_validator],
        help_text="Se manca, quello del committente.",
    )
    street_code = models.CharField(
        "codice del toponimo", max_length=30, blank=True, default=""
    )
    census_level = models.PositiveSmallIntegerField(
        "livello di censimento", choices=CensusLevel.choices, null=True, blank=True
    )
    surveyed_on = models.DateField("data del rilievo", null=True, blank=True)
    public_excluded = models.BooleanField("esclusa dalla mappa pubblica", default=False)
    notes = models.TextField("note", blank=True, default="")

    objects = AreaQuerySet.as_manager()

    constraint_error_fields = {
        "area_number_not_unique": "number",
        "area_management_dates_invalid": "management_end",
    }

    class Meta:
        verbose_name = "area"
        verbose_name_plural = "aree"
        ordering = ["client", "number", "sub_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["client", "number", "sub_number"],
                name="territory_area_number_uniq",
                violation_error_code="area_number_not_unique",
                violation_error_message="An area with this number already exists.",
            ),
            models.CheckConstraint(
                condition=Q(management_end__isnull=True)
                | Q(management_end__gte=F("management_start")),
                name="territory_area_management_dates",
                violation_error_code="area_management_dates_invalid",
                violation_error_message="The management cannot end before it "
                "starts.",
            ),
        ]

    def __str__(self):
        return f"{self.code} {self.name}"

    @property
    def code(self):
        """Number and sub-number: the code of the area (CAM)."""
        return f"{self.number}/{self.sub_number}" if self.sub_number else self.number


# The geometry stays out of the technical history: the surface and the perimeter
# tell its changes there, and the ChangeRecord keeps it whole.
register_audit(Zone, exclude_fields=("geometry",))
register_audit(Area, exclude_fields=("geometry",))
