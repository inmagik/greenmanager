import type { IconType } from "react-icons"
import { TbBinaryTree, TbCategory, TbChartBar, TbListDetails, TbMapPin, TbPlant2, TbTrashX } from "react-icons/tb"
import {
  areaUsesApi,
  attributeDefinitionsApi,
  elementClassesApi,
  removalCausesApi,
  speciesApi,
  urbanGreenTypesApi,
  usageIntensitiesApi,
} from "./api/catalogs"
import type { CatalogApi } from "./api/createCatalogApi"
import {
  ATTRIBUTE_DATA_TYPES,
  ELEMENT_CATEGORIES,
  GEOMETRY_TYPES,
  ISTAT_REMOVAL_CAUSES,
  QUANTITY_UNITS,
  SPECIES_MODES,
  SPECIES_RANKS,
} from "./types"

/**
 * A field of a catalog beyond the common ones (code, description, order, source): a form field, a column of the list,
 * a filter.
 *
 * - The label is `catalogs.fields.<name>`, unless the catalog has its own (`catalogs.<key>.fields.<name>`); a
 *   description, if any, is `catalogs.fields.<name>Description`.
 * - The values of an `enum` are labelled `catalogs.enums.<name>.<value>`; `initial` is the value of a new entry, as
 *   the default of the server.
 * - `derived`: computed by the server, shown read-only and never sent.
 * - `onlyWhen`: shown only when the values of the form match; otherwise the form sends its empty value.
 * - `speciesParent` and `classAttributes` are the parent of a species and the attributes of a class.
 */
export type FieldDefinition = {
  name: string
  required?: boolean
  derived?: boolean
  onlyWhen?: (values: Record<string, unknown>) => boolean
  /** Spans the whole width of the form. */
  wide?: boolean
} & (
  | { kind: "enum"; options: readonly string[]; initial?: string }
  | { kind: "number"; min?: number }
  | { kind: "text"; maxLength?: number }
  | { kind: "boolean" }
  | { kind: "list" }
  | { kind: "speciesParent" }
  | { kind: "classAttributes" }
)

export type CatalogDefinition = {
  /** The segment of the route and of the API (`api/catalogs/<slug>/`). */
  slug: string
  /** The key of its translations, `catalogs.<key>`. */
  key: string
  icon: IconType
  api: CatalogApi
  /** System entries plus the entries of the organizations, which hide the system ones they do not use. */
  extensible: boolean
  /** The organizations add entries; otherwise only staff users do, as system entries. */
  organizationEntries: boolean
  /** The field of the name in the forms: the name of a species is its scientific name. */
  nameField: string
  /** The ordering field of the name column. */
  nameOrdering: string
  fields: FieldDefinition[]
  /** Fields shown as columns of the list. */
  columns: string[]
  /** Fields of kind `enum` offered as filters of the list (filters of the server). */
  filters: string[]
}

const simpleCatalog = {
  extensible: true,
  organizationEntries: true,
  nameField: "name",
  nameOrdering: "name",
  fields: [],
  columns: [],
  filters: [],
}

export const CATALOGS: Record<string, CatalogDefinition> = {
  species: {
    ...simpleCatalog,
    slug: "species",
    key: "species",
    icon: TbPlant2,
    api: speciesApi,
    nameField: "scientific_name",
    nameOrdering: "scientific_name",
    fields: [
      { name: "rank", kind: "enum", options: SPECIES_RANKS, required: true, initial: "species" },
      { name: "genus", kind: "text", derived: true },
      { name: "common_name", kind: "text", maxLength: 255 },
      { name: "family", kind: "text", maxLength: 100 },
      // A genus has no parent.
      { name: "parent", kind: "speciesParent", onlyWhen: (values) => values.rank !== "genus" },
      { name: "synonyms", kind: "list" },
      { name: "external_ref", kind: "text", maxLength: 255 },
    ],
    columns: ["common_name", "rank", "family"],
    filters: ["rank"],
  },
  elementClasses: {
    ...simpleCatalog,
    slug: "element-classes",
    key: "elementClasses",
    icon: TbCategory,
    api: elementClassesApi,
    fields: [
      { name: "category", kind: "enum", options: ELEMENT_CATEGORIES, required: true },
      { name: "geometry_type", kind: "enum", options: GEOMETRY_TYPES, required: true },
      { name: "quantity_unit", kind: "enum", options: QUANTITY_UNITS, required: true },
      { name: "species_mode", kind: "enum", options: SPECIES_MODES, required: true },
      { name: "counts_as_tree", kind: "boolean" },
      { name: "is_planting_site", kind: "boolean" },
      { name: "class_attributes", kind: "classAttributes", wide: true },
    ],
    columns: ["category", "geometry_type", "species_mode"],
    filters: ["category", "geometry_type"],
  },
  attributeDefinitions: {
    ...simpleCatalog,
    slug: "attribute-definitions",
    key: "attributeDefinitions",
    icon: TbListDetails,
    api: attributeDefinitionsApi,
    // The organizations add attributes in v2 (EL-4).
    organizationEntries: false,
    fields: [
      { name: "data_type", kind: "enum", options: ATTRIBUTE_DATA_TYPES, required: true },
      { name: "unit", kind: "text", maxLength: 30 },
      { name: "choices", kind: "list", onlyWhen: (values) => values.data_type === "choice" },
      { name: "is_measure", kind: "boolean" },
    ],
    columns: ["data_type", "unit", "is_measure"],
    filters: ["data_type"],
  },
  urbanGreenTypes: {
    ...simpleCatalog,
    slug: "urban-green-types",
    key: "urbanGreenTypes",
    icon: TbBinaryTree,
    api: urbanGreenTypesApi,
    // The ISTAT typologies: system entries only.
    extensible: false,
    organizationEntries: false,
  },
  areaUses: {
    ...simpleCatalog,
    slug: "area-uses",
    key: "areaUses",
    icon: TbMapPin,
    api: areaUsesApi,
  },
  usageIntensities: {
    ...simpleCatalog,
    slug: "usage-intensities",
    key: "usageIntensities",
    icon: TbChartBar,
    api: usageIntensitiesApi,
    fields: [{ name: "rank", kind: "number", min: 0, required: true }],
    columns: ["rank"],
  },
  removalCauses: {
    ...simpleCatalog,
    slug: "removal-causes",
    key: "removalCauses",
    icon: TbTrashX,
    api: removalCausesApi,
    fields: [{ name: "istat_cause", kind: "enum", options: ISTAT_REMOVAL_CAUSES, required: true }],
    columns: ["istat_cause"],
  },
}
