"""
Catalogs of the first vertical slice (§2 of 04-modello-dati.md).

The common fields and rules are in ``base.py``. Enumerations that drive the logic
of the application stay in the code (D-027).
"""

from core.audit import register_audit
from core.enums import GeometryType
from core.models import TrackedModel
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Lower

from .base import ExtensibleCatalog, FixedCatalog


class Species(ExtensibleCatalog):
    """Botanical catalog: genera, species, hybrids and cultivars (CT-2, D-006)."""

    class Rank(models.TextChoices):
        GENUS = "genus", "Genere"
        SPECIES = "species", "Specie"
        HYBRID = "hybrid", "Ibrido"
        CULTIVAR = "cultivar", "Cultivar"

    rank = models.CharField(
        "livello", max_length=20, choices=Rank.choices, default=Rank.SPECIES
    )
    scientific_name = models.CharField("nome scientifico", max_length=255)
    genus = models.CharField("genere", max_length=100)
    specific_epithet = models.CharField(
        "epiteto specifico", max_length=100, blank=True, default=""
    )
    infraspecific = models.CharField(
        "rango infraspecifico", max_length=100, blank=True, default=""
    )
    cultivar = models.CharField("cultivar", max_length=100, blank=True, default="")
    family = models.CharField("famiglia", max_length=100, blank=True, default="")
    common_name = models.CharField(
        "nome comune", max_length=255, blank=True, default=""
    )
    parent = models.ForeignKey(
        "self",
        verbose_name="voce superiore",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="children",
    )
    synonyms = ArrayField(
        models.CharField(max_length=255),
        verbose_name="sinonimi",
        blank=True,
        default=list,
    )
    external_ref = models.CharField(
        "riferimento esterno", max_length=255, blank=True, default=""
    )

    constraint_error_fields = {
        **ExtensibleCatalog.constraint_error_fields,
        "species_name_not_unique": "scientific_name",
    }

    class Meta(ExtensibleCatalog.Meta):
        verbose_name = "specie"
        verbose_name_plural = "specie"
        ordering = ["scientific_name"]
        constraints = [
            *ExtensibleCatalog.Meta.constraints,
            models.UniqueConstraint(
                Lower("scientific_name"),
                "organization",
                nulls_distinct=False,
                name="catalogs_species_name_uniq",
                violation_error_code="species_name_not_unique",
                violation_error_message="An entry with this scientific name "
                "already exists.",
            ),
        ]

    def __str__(self):
        return self.scientific_name

    def clean(self):
        super().clean()
        if self.parent_id is not None and self.parent_id == self.pk:
            raise ValidationError(
                {
                    "parent": ValidationError(
                        "An entry cannot be its own parent.",
                        code="species_parent_is_self",
                    )
                }
            )


class ElementClass(ExtensibleCatalog):
    """Class of the census elements (CT-3, D-006): geometry, unit, species."""

    class Category(models.TextChoices):
        VEGETATION = "vegetation", "Vegetazione"
        FURNITURE = "furniture", "Arredo"
        PLAY = "play", "Gioco"
        FACILITY = "facility", "Impianto"
        OTHER = "other", "Altro"

    class QuantityUnit(models.TextChoices):
        COUNT = "count", "Numero"
        METER = "meter", "Metro"
        SQUARE_METER = "square_meter", "Metro quadro"

    class SpeciesMode(models.TextChoices):
        NONE = "none", "Nessuna"
        SINGLE = "single", "Singola"
        COMPOSITION = "composition", "Composizione"
        SINGLE_OR_COMPOSITION = "single_or_composition", "Singola o composizione"

    category = models.CharField("categoria", max_length=20, choices=Category.choices)
    geometry_type = models.CharField(
        "tipo di geometria", max_length=20, choices=GeometryType.choices
    )
    quantity_unit = models.CharField(
        "unità di misura", max_length=20, choices=QuantityUnit.choices
    )
    species_mode = models.CharField(
        "specie", max_length=30, choices=SpeciesMode.choices
    )
    counts_as_tree = models.BooleanField("conta come albero", default=False)
    is_planting_site = models.BooleanField("posto d'impianto", default=False)

    locked_when_in_use = ("geometry_type", "species_mode")

    class Meta(ExtensibleCatalog.Meta):
        verbose_name = "classe di elemento"
        verbose_name_plural = "classi di elemento"


class AttributeDefinition(ExtensibleCatalog):
    """Attribute surveyed on the elements of some classes (EL-3).

    Measures vary in time and are recorded in the observations (D-028); the other
    attributes are values of the element.
    """

    class DataType(models.TextChoices):
        NUMBER = "number", "Numero"
        TEXT = "text", "Testo"
        BOOLEAN = "boolean", "Sì/no"
        CHOICE = "choice", "Scelta"
        DATE = "date", "Data"

    # The organizations add attributes in v2 (EL-4).
    organization_entries_allowed = False

    data_type = models.CharField("tipo", max_length=20, choices=DataType.choices)
    unit = models.CharField("unità", max_length=30, blank=True, default="")
    choices = ArrayField(
        models.CharField(max_length=255),
        verbose_name="valori ammessi",
        blank=True,
        default=list,
    )
    is_measure = models.BooleanField(
        "misura",
        default=False,
        help_text="Varia nel tempo e si registra nelle osservazioni.",
    )

    locked_when_in_use = ("data_type",)

    class Meta(ExtensibleCatalog.Meta):
        verbose_name = "attributo"
        verbose_name_plural = "attributi"

    def clean(self):
        super().clean()
        if self.data_type == self.DataType.CHOICE and not self.choices:
            raise ValidationError(
                {
                    "choices": ValidationError(
                        "A choice attribute needs its values.",
                        code="attribute_choices_required",
                    )
                }
            )
        if self.data_type != self.DataType.CHOICE and self.choices:
            raise ValidationError(
                {
                    "choices": ValidationError(
                        "Only choice attributes have values.",
                        code="attribute_choices_not_allowed",
                    )
                }
            )
        if len(set(self.choices)) != len(self.choices):
            raise ValidationError(
                {
                    "choices": ValidationError(
                        "The values must be different.",
                        code="attribute_choices_duplicated",
                    )
                }
            )


class ElementClassAttribute(TrackedModel):
    """An attribute surveyed on the elements of a class."""

    element_class = models.ForeignKey(
        ElementClass,
        verbose_name="classe di elemento",
        on_delete=models.CASCADE,
        related_name="class_attributes",
    )
    attribute = models.ForeignKey(
        AttributeDefinition,
        verbose_name="attributo",
        on_delete=models.PROTECT,
        related_name="class_links",
    )
    required = models.BooleanField("obbligatorio", default=False)
    sort_order = models.IntegerField("ordine", default=0)

    class Meta:
        verbose_name = "attributo della classe"
        verbose_name_plural = "attributi delle classi"
        ordering = ["sort_order", "attribute__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["element_class", "attribute"],
                name="catalogs_class_attribute_uniq",
                violation_error_code="class_attribute_duplicated",
                violation_error_message="The attribute is already in the class.",
            ),
        ]

    def __str__(self):
        return f"{self.element_class} · {self.attribute}"


class UrbanGreenType(FixedCatalog):
    """Urban green typologies of the ISTAT survey (D-009)."""

    class Meta(FixedCatalog.Meta):
        verbose_name = "tipologia di verde urbano"
        verbose_name_plural = "tipologie di verde urbano"


class AreaUse(ExtensibleCatalog):
    """Intended use of an area (D-009)."""

    class Meta(ExtensibleCatalog.Meta):
        verbose_name = "destinazione d'uso"
        verbose_name_plural = "destinazioni d'uso"


class UsageIntensity(ExtensibleCatalog):
    """Intensity of use of an area (D-009): the rank grows with the intensity."""

    rank = models.PositiveSmallIntegerField("rango", default=0)

    class Meta(ExtensibleCatalog.Meta):
        verbose_name = "intensità di fruizione"
        verbose_name_plural = "intensità di fruizione"
        ordering = ["rank", "name"]


class RemovalCause(ExtensibleCatalog):
    """Cause of the removal of an element, mapped to the ISTAT causes (IN-11)."""

    class IstatCause(models.TextChoices):
        FALL_RISK = "fall_risk", "Rischio di caduta"
        WEATHER_EVENT = "weather_event", "Eventi atmosferici"
        OTHER = "other", "Altre cause"

    istat_cause = models.CharField(
        "causa ISTAT", max_length=20, choices=IstatCause.choices
    )

    class Meta(ExtensibleCatalog.Meta):
        verbose_name = "causa di rimozione"
        verbose_name_plural = "cause di rimozione"


EXTENSIBLE_CATALOGS = (
    Species,
    ElementClass,
    AttributeDefinition,
    AreaUse,
    UsageIntensity,
    RemovalCause,
)
FIXED_CATALOGS = (UrbanGreenType,)

for model in EXTENSIBLE_CATALOGS:
    register_audit(model, m2m_fields={"hidden_by"})
for model in (*FIXED_CATALOGS, ElementClassAttribute):
    register_audit(model)
