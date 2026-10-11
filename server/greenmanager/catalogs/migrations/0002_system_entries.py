"""
System entries of the catalogs of the first vertical slice (§2.7 of
04-modello-dati.md).

The data are written here, frozen with the migration: later changes go in new
data migrations. The keys are deterministic (``core.models.system_entry_id``), the
same in every installation. The species are loaded with the ``import_species``
command: their list grows and is curated over time.
"""

import uuid

from django.db import migrations

# Copy of core.models.SYSTEM_ENTRY_NAMESPACE: a migration does not import app code.
SYSTEM_ENTRY_NAMESPACE = uuid.UUID("5d0f2a3c-7e5b-4c1d-9a8e-2b6f4c3d1e90")

ISTAT_SOURCE = "ISTAT, Dati ambientali nelle città, questionario Verde urbano 2024"
INITIAL_SOURCE = "GreenManager, elenco iniziale"
PROVISIONAL_SOURCE = "GreenManager, elenco iniziale provvisorio"

URBAN_GREEN_TYPES = [
    (
        "historic_green",
        "Verde storico",
        "Ville, giardini e parchi di interesse artistico o storico, tutelati dal "
        "D.Lgs. 42/2004.",
    ),
    (
        "urban_park",
        "Parchi urbani",
        "Parchi aperti al pubblico non vincolati, esclusi i piccoli spazi di "
        "quartiere.",
    ),
    (
        "equipped_green",
        "Verde attrezzato",
        "Piccoli parchi e giardini di quartiere, con giochi, aree cani, panchine.",
    ),
    (
        "street_green",
        "Aree di arredo urbano",
        "Verde legato alla viabilità: rotonde, spartitraffico, aiuole, alberature "
        "stradali, piste ciclabili.",
    ),
    (
        "urban_forestation",
        "Forestazione urbana",
        "Nuovi boschi urbani e periurbani su aree prima libere.",
    ),
    ("school_garden", "Giardini scolastici", "Verde di pertinenza delle scuole."),
    ("botanical_garden", "Orti botanici", ""),
    (
        "urban_allotments",
        "Orti urbani",
        "Appezzamenti comunali assegnati ai cittadini.",
    ),
    ("zoo", "Giardini zoologici", ""),
    ("cemetery", "Cimiteri", ""),
    (
        "outdoor_sports",
        "Aree sportive all'aperto",
        "Verde dei campi sportivi e delle aree ludico-ricreative.",
    ),
    ("woodland", "Aree boschive", "Superfici boscate, secondo la definizione FAO."),
    (
        "unmanaged_green",
        "Verde incolto",
        "Aree verdi urbane senza manutenzione programmata.",
    ),
    ("other", "Altro", "Aree non comprese nelle voci precedenti."),
]

USAGE_INTENSITIES = [
    ("low", "Bassa", 1),
    ("medium", "Media", 2),
    ("high", "Alta", 3),
]

REMOVAL_CAUSES = [
    ("fall_risk", "Rischio di cedimento", "fall_risk"),
    ("disease", "Malattia o morte della pianta", "fall_risk"),
    ("weather_event", "Evento atmosferico", "weather_event"),
    ("works", "Lavori o cantieri", "other"),
    ("redesign", "Riqualificazione dell'area", "other"),
    ("other", "Altra causa", "other"),
]

# To be revised with the first clients (§2.7): ideas from the functional areas of
# the CAM data model (secondary type 27).
AREA_USES = [
    ("public_garden", "Parco o giardino pubblico"),
    ("playground", "Area gioco"),
    ("dog_area", "Area cani"),
    ("street_green", "Verde stradale"),
    ("school_green", "Verde scolastico"),
    ("sports_green", "Verde sportivo"),
    ("cemetery_green", "Verde cimiteriale"),
    ("allotments", "Orti"),
    ("building_grounds", "Verde di pertinenza di edifici"),
    ("other", "Altro"),
]

# code, name, category, geometry, unit, species mode, counts as tree
ELEMENT_CLASSES = [
    ("tree", "Albero", "vegetation", "point", "count", "single", True),
    ("shrub", "Arbusto", "vegetation", "point", "count", "single", False),
    ("climber", "Rampicante", "vegetation", "point", "count", "single", False),
    (
        "hedge",
        "Siepe",
        "vegetation",
        "line",
        "meter",
        "single_or_composition",
        False,
    ),
    (
        "tree_row",
        "Filare",
        "vegetation",
        "line",
        "meter",
        "single_or_composition",
        False,
    ),
    ("lawn", "Prato", "vegetation", "polygon", "square_meter", "none", False),
    (
        "flowerbed",
        "Aiuola",
        "vegetation",
        "polygon",
        "square_meter",
        "composition",
        False,
    ),
    (
        "shrubland",
        "Macchia arbustiva",
        "vegetation",
        "polygon",
        "square_meter",
        "composition",
        False,
    ),
    (
        "tree_group",
        "Gruppo di alberi",
        "vegetation",
        "polygon",
        "square_meter",
        "composition",
        False,
    ),
    (
        "woodland",
        "Bosco",
        "vegetation",
        "polygon",
        "square_meter",
        "composition",
        False,
    ),
    (
        "aquatic_vegetation",
        "Vegetazione acquatica",
        "vegetation",
        "polygon",
        "square_meter",
        "composition",
        False,
    ),
    ("bench", "Panchina", "furniture", "point", "count", "none", False),
    ("bin", "Cestino", "furniture", "point", "count", "none", False),
    ("drinking_fountain", "Fontanella", "furniture", "point", "count", "none", False),
    ("paving", "Pavimentazione", "furniture", "polygon", "square_meter", "none", False),
    ("fence", "Recinzione", "furniture", "line", "meter", "none", False),
    ("play_item", "Gioco singolo", "play", "point", "count", "none", False),
    ("play_structure", "Gioco complesso", "play", "point", "count", "none", False),
    (
        "irrigation_line",
        "Linea di irrigazione",
        "facility",
        "line",
        "meter",
        "none",
        False,
    ),
    (
        "irrigation_point",
        "Punto di irrigazione",
        "facility",
        "point",
        "count",
        "none",
        False,
    ),
]

ELEMENT_CLASS_DESCRIPTIONS = {
    "tree_row": "Solo per i filari non censiti albero per albero: altrimenti ogni "
    "albero è un elemento.",
    "play_structure": "Gioco con più funzioni o strutture collegate.",
    "irrigation_point": "Irrigatore, ala gocciolante, pozzetto o centralina.",
}

# code, name, data type, unit, choices, is measure
ATTRIBUTES = [
    (
        "lawn_type",
        "Tipo di prato",
        "choice",
        "",
        ["ornamentale", "rustico", "fiorito", "in scarpata"],
        False,
    ),
    (
        "material",
        "Materiale",
        "choice",
        "",
        ["legno", "metallo", "pietra", "calcestruzzo", "plastica", "misto"],
        False,
    ),
    (
        "paving_type",
        "Tipo di pavimentazione",
        "choice",
        "",
        [
            "pietra",
            "asfalto",
            "calcestre",
            "ghiaia",
            "autobloccanti",
            "gomma antitrauma",
            "legno",
        ],
        False,
    ),
    ("irrigated", "Irrigato", "boolean", "", [], False),
    ("height", "Altezza", "number", "m", [], True),
    ("width", "Larghezza", "number", "m", [], True),
]

# class code: [(attribute code, required)]
CLASS_ATTRIBUTES = {
    "lawn": [("lawn_type", False), ("irrigated", False)],
    "flowerbed": [("irrigated", False)],
    "hedge": [("height", False), ("width", False), ("irrigated", False)],
    "bench": [("material", False)],
    "bin": [("material", False)],
    "fence": [("material", False)],
    "paving": [("paving_type", False)],
}


def entry_id(model_label, code):
    return uuid.uuid5(SYSTEM_ENTRY_NAMESPACE, f"{model_label}:{code}")


def create_entries(apps, model_name, rows):
    model = apps.get_model("catalogs", model_name)
    label = f"catalogs.{model_name.lower()}"
    for index, row in enumerate(rows):
        values = dict(row)
        model.objects.update_or_create(
            id=entry_id(label, values["code"]),
            defaults={"sort_order": index * 10, **values},
        )


def forwards(apps, schema_editor):
    create_entries(
        apps,
        "UrbanGreenType",
        [
            {"code": code, "name": name, "description": description}
            | {"source": ISTAT_SOURCE}
            for code, name, description in URBAN_GREEN_TYPES
        ],
    )
    create_entries(
        apps,
        "UsageIntensity",
        [
            {"code": code, "name": name, "rank": rank, "source": INITIAL_SOURCE}
            for code, name, rank in USAGE_INTENSITIES
        ],
    )
    create_entries(
        apps,
        "RemovalCause",
        [
            {
                "code": code,
                "name": name,
                "istat_cause": istat_cause,
                "source": INITIAL_SOURCE,
            }
            for code, name, istat_cause in REMOVAL_CAUSES
        ],
    )
    create_entries(
        apps,
        "AreaUse",
        [
            {"code": code, "name": name, "source": PROVISIONAL_SOURCE}
            for code, name in AREA_USES
        ],
    )
    create_entries(
        apps,
        "ElementClass",
        [
            {
                "code": code,
                "name": name,
                "description": ELEMENT_CLASS_DESCRIPTIONS.get(code, ""),
                "category": category,
                "geometry_type": geometry_type,
                "quantity_unit": quantity_unit,
                "species_mode": species_mode,
                "counts_as_tree": counts_as_tree,
                "source": "Catalogo degli oggetti del modello dati CAM v2.1",
            }
            for (
                code,
                name,
                category,
                geometry_type,
                quantity_unit,
                species_mode,
                counts_as_tree,
            ) in ELEMENT_CLASSES
        ],
    )
    create_entries(
        apps,
        "AttributeDefinition",
        [
            {
                "code": code,
                "name": name,
                "data_type": data_type,
                "unit": unit,
                "choices": choices,
                "is_measure": is_measure,
                "source": INITIAL_SOURCE,
            }
            for code, name, data_type, unit, choices, is_measure in ATTRIBUTES
        ],
    )

    ElementClassAttribute = apps.get_model("catalogs", "ElementClassAttribute")
    for class_code, attributes in CLASS_ATTRIBUTES.items():
        for index, (attribute_code, required) in enumerate(attributes):
            ElementClassAttribute.objects.update_or_create(
                element_class_id=entry_id("catalogs.elementclass", class_code),
                attribute_id=entry_id("catalogs.attributedefinition", attribute_code),
                defaults={"required": required, "sort_order": index * 10},
            )


def backwards(apps, schema_editor):
    ElementClassAttribute = apps.get_model("catalogs", "ElementClassAttribute")
    ElementClassAttribute.objects.filter(
        element_class_id__in=[
            entry_id("catalogs.elementclass", code) for code in CLASS_ATTRIBUTES
        ]
    ).delete()
    for model_name, rows in (
        ("AttributeDefinition", ATTRIBUTES),
        ("ElementClass", ELEMENT_CLASSES),
        ("AreaUse", AREA_USES),
        ("RemovalCause", REMOVAL_CAUSES),
        ("UsageIntensity", USAGE_INTENSITIES),
        ("UrbanGreenType", URBAN_GREEN_TYPES),
    ):
        model = apps.get_model("catalogs", model_name)
        label = f"catalogs.{model_name.lower()}"
        model.objects.filter(id__in=[entry_id(label, row[0]) for row in rows]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("catalogs", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
