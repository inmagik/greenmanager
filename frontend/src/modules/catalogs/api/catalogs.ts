import type {
  AttributeChoice,
  AttributeDefinition,
  CatalogEntry,
  ElementClass,
  ElementClassChoice,
  RemovalCause,
  Species,
  SpeciesChoice,
  UsageIntensity,
} from "../types"
import { createCatalogApi } from "./createCatalogApi"

export const speciesApi = createCatalogApi<Species, SpeciesChoice>("species")
export const elementClassesApi = createCatalogApi<ElementClass, ElementClassChoice>("element-classes")
export const attributeDefinitionsApi = createCatalogApi<AttributeDefinition, AttributeChoice>("attribute-definitions")
export const urbanGreenTypesApi = createCatalogApi<CatalogEntry>("urban-green-types")
export const areaUsesApi = createCatalogApi<CatalogEntry>("area-uses")
export const usageIntensitiesApi = createCatalogApi<UsageIntensity>("usage-intensities")
export const removalCausesApi = createCatalogApi<RemovalCause>("removal-causes")
