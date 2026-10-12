import type { ServerWarning } from "@/components/WarningsAlert"
import type { ElementCategory, GeometryType, SpeciesMode } from "@/modules/catalogs/types"
import type { TrackedRecord } from "@/utils/tracking"
import type { MultiLineString, MultiPolygon, Point, LineString, Polygon } from "geojson"

type Summary = { id: string; name: string }
type CatalogSummary = Summary & { code: string }

export const LOCATION_STATUSES = ["verified", "provisional"] as const
export type LocationStatus = (typeof LOCATION_STATUSES)[number]

/** Where the position comes from; empty when it is not said, e.g. coordinates typed in the form. */
export const LOCATION_SOURCES = ["gps", "map", "import", "area_center"] as const
export type LocationSource = (typeof LOCATION_SOURCES)[number] | ""

export type SpeciesSummary = { id: string; scientific_name: string; common_name: string }

/** An element in the lists, without the geometry. */
export type ElementListItem = TrackedRecord & {
  id: string
  client: string
  client_data: Summary
  area: string
  area_data: { id: string; code: string; name: string }
  element_class: string
  element_class_data: CatalogSummary & {
    category: ElementCategory
    geometry_type: GeometryType
    species_mode: SpeciesMode
  }
  species: string | null
  species_data: SpeciesSummary | null
  /** Given by the server, never reused: a number as text. */
  code: string
  tag_number: string
  location_status: LocationStatus
  /** Decimals as text, computed by the server on the ellipsoid: of the lines and of the polygons. */
  length_m: string | null
  surface_m2: string | null
  estimated_count: number | null
  planted_on: string | null
  removed_on: string | null
  removal_cause: string | null
  removal_cause_data: CatalogSummary | null
  /** The perimeter of its area does not cover the element. */
  outside_area: boolean
}

/** A species of a group element, with its quantity or its percentage. */
export type CompositionItem = {
  species: string
  species_data: SpeciesSummary
  quantity: number | null
  /** A decimal as text. */
  percentage: string | null
}

export type AttributeValue = string | number | boolean

export type ElementGeometry = Point | MultiLineString | MultiPolygon

export type Element = ElementListItem & {
  geometry: ElementGeometry
  location_source: LocationSource
  /** The accuracy the device declared, in meters, as text. */
  location_accuracy_m: string | null
  /** By the code of the attribute. */
  attributes: Record<string, AttributeValue>
  composition: CompositionItem[]
  planted_on_estimated: boolean
  /** The removed element whose place the element takes. */
  replaces: string | null
  replaces_data: { id: string; code: string } | null
  surveyed_on: string | null
  public_excluded: boolean
  notes: string
  /** Outside its area and, in the response of a write that gives a tree a new position, the trees very close. */
  warnings: ServerWarning[]
}

/** A geometry sent to the server: lines and polygons may be simple, the server stores them as multipart. */
export type ElementGeometryInput = ElementGeometry | LineString | Polygon

/** The position of an element, as the form and the position tab send it. */
export type ElementPosition = {
  /** None at the center of the area: the server gives it. */
  geometry?: ElementGeometryInput
  location_source: LocationSource
  location_accuracy_m: number | null
  location_status?: LocationStatus
}

export type CompositionPayload = Pick<CompositionItem, "species" | "quantity"> & { percentage: number | null }

/** The data of the element form; the position of a saved element changes in its own tab, the client never. */
export type ElementPayload = Partial<ElementPosition> & {
  area: string
  element_class: string
  tag_number: string
  species: string | null
  composition: CompositionPayload[]
  /** Sent only when they change: a change of other data does not depend on them (D-051). */
  attributes?: Record<string, AttributeValue | null>
  estimated_count: number | null
  planted_on: string | null
  planted_on_estimated: boolean
  replaces: string | null
  surveyed_on: string | null
  public_excluded: boolean
  notes: string
}

/** A position to check before saving it. */
export type ElementGeometryCheck = {
  element_class: string
  geometry: ElementGeometryInput
  client?: string | null
  /** The area chosen in the form. */
  area?: string | null
  /** The element being changed: it gives the client, and stays out of the near trees. */
  element?: string
}

export type ElementGeometryCheckResult = {
  length_m: string | null
  surface_m2: string | null
  /** The area managed today that contains the position, among those of the client. */
  suggested_area: { id: string; code: string; name: string } | null
  warnings: ServerWarning[]
}

export type ElementRemoval = {
  removed_on: string
  removal_cause: string | null
  reason: string
}
