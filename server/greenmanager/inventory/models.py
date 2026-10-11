from decimal import Decimal

from core.audit import register_audit
from core.models import TrackedModel
from django.contrib.gis.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db.models import F, Q
from django.db.models.functions import Length
from parties.models import ClientDataQuerySet

# Stored types of the geometries of the elements (core.geo.normalize): points are
# simple, lines and polygons multipart (D-035).
STORED_GEOMETRY_TYPES = ("POINT", "MULTILINESTRING", "MULTIPOLYGON")


def code_order(descending=False):
    """Natural order of the codes, numbers stored as text: "2" before "10"."""
    if descending:
        return (Length("code").desc(), F("code").desc())
    return (Length("code").asc(), F("code").asc())


class ElementQuerySet(ClientDataQuerySet):
    def present_on(self, date):
        """
        Elements present on ``date`` (§4.3 of 04-modello-dati.md): planted by
        then and not yet removed. An element whose planting date is estimated, or
        unknown, counts from the start of the management of its area.
        """
        planted = Q(planted_on__lte=date) | (
            (Q(planted_on__isnull=True) | Q(planted_on_estimated=True))
            & Q(area__management_start__lte=date)
        )
        return self.filter(planted).filter(
            Q(removed_on__isnull=True) | Q(removed_on__gt=date)
        )


class Element(TrackedModel):
    """A census element with its geometry (EL-1): the unit of the census (D-002)."""

    class LocationStatus(models.TextChoices):
        VERIFIED = "verified", "Verificata"
        PROVISIONAL = "provisional", "Provvisoria"

    class LocationSource(models.TextChoices):
        GPS = "gps", "GPS"
        MAP = "map", "Mappa"
        IMPORT = "import", "Import"
        AREA_CENTER = "area_center", "Centro dell'area"

    # The client of the area, copied by the services: it does not change.
    client = models.ForeignKey(
        "parties.Client",
        verbose_name="committente",
        on_delete=models.PROTECT,
        related_name="elements",
    )
    area = models.ForeignKey(
        "territory.Area",
        verbose_name="area",
        on_delete=models.PROTECT,
        related_name="elements",
    )
    element_class = models.ForeignKey(
        "catalogs.ElementClass",
        verbose_name="classe",
        on_delete=models.PROTECT,
        related_name="elements",
    )
    # Of the type of the class: a point, or a multipart line or polygon.
    geometry = models.GeometryField("geometria", srid=4326)
    location_status = models.CharField(
        "posizione",
        max_length=20,
        choices=LocationStatus.choices,
        default=LocationStatus.VERIFIED,
    )
    location_source = models.CharField(
        "origine della posizione",
        max_length=20,
        choices=LocationSource.choices,
        blank=True,
        default="",
    )
    location_accuracy_m = models.DecimalField(
        "precisione della posizione (m)",
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal(0))],
    )
    # Given by the services from a counter of the client: never reused (EL-8).
    code = models.CharField(
        "codice",
        max_length=20,
        editable=False,
        help_text="Univoco per committente e mai riusato (campo PT del CAM).",
    )
    tag_number = models.CharField(
        "numero di cartellino",
        max_length=50,
        blank=True,
        default="",
        help_text="Univoco tra gli elementi presenti del committente.",
    )
    species = models.ForeignKey(
        "catalogs.Species",
        verbose_name="specie",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="elements",
    )
    attributes = models.JSONField(
        "attributi",
        default=dict,
        blank=True,
        help_text="Valori degli attributi della classe che non sono misure.",
    )
    estimated_count = models.PositiveIntegerField(
        "numero stimato di individui", null=True, blank=True
    )
    planted_on = models.DateField(
        "data di posa o di messa a dimora", null=True, blank=True
    )
    planted_on_estimated = models.BooleanField("data di posa stimata", default=False)
    replaces = models.ForeignKey(
        "self",
        verbose_name="prende il posto di",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="replaced_by",
    )
    removed_on = models.DateField("data di rimozione", null=True, blank=True)
    removal_cause = models.ForeignKey(
        "catalogs.RemovalCause",
        verbose_name="causa della rimozione",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="elements",
    )
    surveyed_on = models.DateField("data del rilievo", null=True, blank=True)
    public_excluded = models.BooleanField("escluso dalla mappa pubblica", default=False)
    notes = models.TextField("note", blank=True, default="")
    # Computed from the geometry by the services, on the ellipsoid: the length of
    # the lines and the surface of the polygons.
    length_m = models.DecimalField(
        "lunghezza (m)",
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
    )
    surface_m2 = models.DecimalField(
        "superficie (m²)",
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
    )

    objects = ElementQuerySet.as_manager()

    constraint_error_fields = {
        "element_code_not_unique": "code",
        "element_tag_number_not_unique": "tag_number",
        "element_geometry_type_invalid": "geometry",
        "element_removed_before_planted": "removed_on",
        "element_removal_cause_without_date": "removal_cause",
    }

    class Meta:
        verbose_name = "elemento"
        verbose_name_plural = "elementi"
        ordering = ["client", *code_order()]
        indexes = [
            models.Index(
                fields=["client", "element_class", "species"],
                name="inventory_element_class_idx",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["client", "code"],
                name="inventory_element_code_uniq",
                violation_error_code="element_code_not_unique",
                violation_error_message="An element with this code already exists.",
            ),
            models.UniqueConstraint(
                fields=["client", "tag_number"],
                condition=Q(removed_on__isnull=True) & ~Q(tag_number=""),
                name="inventory_element_tag_number_uniq",
                violation_error_code="element_tag_number_not_unique",
                violation_error_message="A present element already has this tag "
                "number.",
            ),
            models.CheckConstraint(
                condition=Q(geometry__geom_type__in=STORED_GEOMETRY_TYPES),
                name="inventory_element_geometry_type",
                violation_error_code="element_geometry_type_invalid",
                violation_error_message="The geometry must be a point, a "
                "multipart line or a multipart polygon.",
            ),
            models.CheckConstraint(
                condition=Q(planted_on__isnull=True)
                | Q(removed_on__isnull=True)
                | Q(removed_on__gte=F("planted_on")),
                name="inventory_element_removal_dates",
                violation_error_code="element_removed_before_planted",
                violation_error_message="The element cannot be removed before it "
                "was planted.",
            ),
            models.CheckConstraint(
                condition=Q(removal_cause__isnull=True) | Q(removed_on__isnull=False),
                name="inventory_element_removal_cause",
                violation_error_code="element_removal_cause_without_date",
                violation_error_message="The cause of the removal needs its date.",
            ),
        ]

    def __str__(self):
        return f"{self.code} {self.element_class}"


class CompositionItem(TrackedModel):
    """A species of a group element, with its quantity or percentage (EL-5,
    D-018)."""

    element = models.ForeignKey(
        Element,
        verbose_name="elemento",
        on_delete=models.CASCADE,
        related_name="composition",
    )
    species = models.ForeignKey(
        "catalogs.Species",
        verbose_name="specie",
        on_delete=models.PROTECT,
        related_name="composition_items",
    )
    quantity = models.PositiveIntegerField(
        "numero di individui",
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
    )
    percentage = models.DecimalField(
        "percentuale",
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("0.01")),
            MaxValueValidator(Decimal(100)),
        ],
        help_text="Sulla superficie o sulla lunghezza dell'elemento.",
    )

    class Meta:
        verbose_name = "voce della composizione"
        verbose_name_plural = "composizione"
        ordering = ["species__scientific_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["element", "species"],
                name="inventory_composition_species_uniq",
                violation_error_code="composition_species_duplicated",
                violation_error_message="The species is already in the " "composition.",
            ),
            models.CheckConstraint(
                condition=Q(quantity__isnull=False) | Q(percentage__isnull=False),
                name="inventory_composition_quantity",
                violation_error_code="composition_quantity_required",
                violation_error_message="Each species has a quantity or a "
                "percentage.",
            ),
        ]

    def __str__(self):
        return f"{self.element} · {self.species}"


# The geometry stays out of the technical history: length and surface tell its
# changes there, and the ChangeRecord keeps it whole.
register_audit(Element, exclude_fields=("geometry",))
register_audit(CompositionItem)
