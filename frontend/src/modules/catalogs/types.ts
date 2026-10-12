import type { TrackedRecord } from "@/utils/tracking"

/** Common fields of the entries of every catalog (`CatalogEntrySerializer` of the server). */
export type CatalogEntry = TrackedRecord & {
  id: string
  code: string
  name: string
  description: string
  sort_order: number
  source: string
  retired: boolean
  /** A system entry, shared by every organization: only staff users change it. */
  is_system: boolean
  /** The organization of the request hides the system entry. */
  is_hidden: boolean
  /** The organization can pick the entry: not retired, and not hidden. */
  is_available: boolean
  /** Fields that cannot change because the entry is in use. */
  locked_fields: string[]
  /** In the extensible catalogs: the organization of an own entry, `null` for a system entry. */
  organization?: number | null
}

/** An entry in the selects (`choices/`): the available entries only. */
export type CatalogChoice = Pick<CatalogEntry, "id" | "code" | "name" | "is_system">

export const SPECIES_RANKS = ["genus", "species", "hybrid", "cultivar"] as const
export type SpeciesRank = (typeof SPECIES_RANKS)[number]

export type Species = CatalogEntry & {
  rank: SpeciesRank
  scientific_name: string
  /** From the scientific name, as `name`. */
  genus: string
  specific_epithet: string
  infraspecific: string
  cultivar: string
  family: string
  common_name: string
  parent: string | null
  parent_data: CatalogChoice | null
  synonyms: string[]
  external_ref: string
}

export type SpeciesChoice = CatalogChoice & Pick<Species, "scientific_name" | "common_name" | "rank">

export const ELEMENT_CATEGORIES = ["vegetation", "furniture", "play", "facility", "other"] as const
export type ElementCategory = (typeof ELEMENT_CATEGORIES)[number]

export const GEOMETRY_TYPES = ["point", "line", "polygon"] as const
export type GeometryType = (typeof GEOMETRY_TYPES)[number]

export const QUANTITY_UNITS = ["count", "meter", "square_meter"] as const
export type QuantityUnit = (typeof QUANTITY_UNITS)[number]

export const SPECIES_MODES = ["none", "single", "composition", "single_or_composition"] as const
export type SpeciesMode = (typeof SPECIES_MODES)[number]

export const ATTRIBUTE_DATA_TYPES = ["number", "text", "boolean", "choice", "date"] as const
export type AttributeDataType = (typeof ATTRIBUTE_DATA_TYPES)[number]

export type AttributeDefinition = CatalogEntry & {
  data_type: AttributeDataType
  unit: string
  /** The allowed values of a choice attribute. */
  choices: string[]
  /** A measure varies in time: it is recorded in the observations, not on the element. */
  is_measure: boolean
}

export type AttributeChoice = CatalogChoice &
  Pick<AttributeDefinition, "data_type" | "unit" | "choices" | "is_measure" | "retired">

/** An attribute surveyed on the elements of a class. */
export type ClassAttribute = {
  id: string
  attribute: string
  attribute_data: AttributeChoice
  required: boolean
  sort_order: number
}

export type ElementClass = CatalogEntry & {
  category: ElementCategory
  geometry_type: GeometryType
  quantity_unit: QuantityUnit
  species_mode: SpeciesMode
  counts_as_tree: boolean
  is_planting_site: boolean
  class_attributes: ClassAttribute[]
}

export type ElementClassChoice = CatalogChoice &
  Pick<
    ElementClass,
    "category" | "geometry_type" | "quantity_unit" | "species_mode" | "counts_as_tree" | "class_attributes"
  >

export type UsageIntensity = CatalogEntry & { rank: number }

export const ISTAT_REMOVAL_CAUSES = ["fall_risk", "weather_event", "other"] as const
export type RemovalCause = CatalogEntry & { istat_cause: (typeof ISTAT_REMOVAL_CAUSES)[number] }
