import type { ServerWarning } from "@/components/WarningsAlert"
import type { TrackedRecord } from "@/utils/tracking"
import type { MultiPolygon, Polygon } from "geojson"

type Summary = { id: string; name: string }
type CatalogSummary = Summary & { code: string }

export type Zone = TrackedRecord & {
  id: string
  client: string
  client_data: Summary
  /** Unique for the client; the server gives the next one when it is missing. */
  code: number
  name: string
  /** The official perimeter, if any: not edited in the interface yet. */
  geometry: MultiPolygon | null
}

/** The data of the zone form; the client does not change after the creation. */
export type ZonePayload = Pick<Zone, "name"> & { client?: string; code: number | null }

/** A zone in the selects (`choices/`). */
export type ZoneChoice = Pick<Zone, "id" | "client" | "code" | "name">

export const CENSUS_LEVELS = [1, 2, 3] as const
export type CensusLevel = (typeof CENSUS_LEVELS)[number]

/** An area in the lists, without the geometry. */
export type AreaListItem = TrackedRecord & {
  id: string
  client: string
  client_data: Summary
  zone: string | null
  zone_data: (Summary & { code: number }) | null
  /** Number and sub-number, e.g. `12/a`. */
  code: string
  number: string
  sub_number: string
  name: string
  /** Decimals as text, computed by the server on the ellipsoid. */
  surface_m2: string
  perimeter_m: string
  is_fictitious: boolean
  urban_green_type: string
  urban_green_type_data: CatalogSummary
  area_use: string
  area_use_data: CatalogSummary
  usage_intensity: string
  usage_intensity_data: CatalogSummary
  management_start: string
  management_end: string | null
  municipality_code: string
  /** It overlaps another area of the client managed in the same period. */
  has_overlaps: boolean
}

export type Area = AreaListItem & {
  geometry: MultiPolygon
  street_code: string
  census_level: CensusLevel | null
  surveyed_on: string | null
  public_excluded: boolean
  notes: string
  /** Checks that do not block the save, such as the overlaps (`area_overlaps`). */
  warnings: ServerWarning[]
}

/** The data of the area form; the geometry changes in its own tab, the client never. */
export type AreaPayload = Pick<
  Area,
  | "number"
  | "sub_number"
  | "name"
  | "zone"
  | "is_fictitious"
  | "urban_green_type"
  | "area_use"
  | "usage_intensity"
  | "management_start"
  | "management_end"
  | "municipality_code"
  | "street_code"
  | "census_level"
  | "surveyed_on"
  | "public_excluded"
  | "notes"
> & { client?: string; geometry?: Polygon | MultiPolygon }

/** A perimeter to check before saving it, with the values of the form that change the overlaps. */
export type AreaGeometryCheck = {
  client: string
  geometry: Polygon | MultiPolygon
  /** The area being changed: it gives the values not sent, and stays out of the overlaps. */
  area?: string
  management_start?: string | null
  management_end?: string | null
  is_fictitious?: boolean
}

export type AreaGeometryCheckResult = {
  surface_m2: string
  perimeter_m: string
  warnings: ServerWarning[]
}
