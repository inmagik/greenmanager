import type { Geometry, MultiLineString, MultiPolygon, Position } from "geojson"

/** The kind of geometry a field takes, as `geometry_type` of the element classes. */
export type GeometryKind = "point" | "line" | "polygon"

const TYPES_OF_KIND: Record<GeometryKind, string[]> = {
  point: ["Point"],
  line: ["LineString", "MultiLineString"],
  polygon: ["Polygon", "MultiPolygon"],
}

const MAX_FILE_SIZE_MB = 10

/** A file that does not give a geometry: `code` is a key of `geometry.fileErrors`, with its params. */
export class GeometryFileError extends Error {
  code: string
  params: Record<string, string | number>

  constructor(code: string, params: Record<string, string | number> = {}) {
    super(code)
    this.code = code
    this.params = params
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** The geometries of a GeoJSON object: a geometry, a Feature or a FeatureCollection. */
function geometriesOf(value: unknown): Geometry[] {
  if (!isRecord(value) || typeof value.type !== "string") throw new GeometryFileError("notGeoJSON")
  switch (value.type) {
    case "FeatureCollection":
      if (!Array.isArray(value.features)) throw new GeometryFileError("notGeoJSON")
      return value.features.flatMap(geometriesOf)
    case "Feature":
      // A feature without a geometry is allowed by GeoJSON: it adds nothing.
      return value.geometry === null ? [] : geometriesOf(value.geometry)
    case "GeometryCollection":
      if (!Array.isArray(value.geometries)) throw new GeometryFileError("notGeoJSON")
      return value.geometries.flatMap(geometriesOf)
    case "Point":
    case "MultiPoint":
    case "LineString":
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
      if (!Array.isArray(value.coordinates)) throw new GeometryFileError("notGeoJSON")
      return [value as unknown as Geometry]
    default:
      throw new GeometryFileError("notGeoJSON")
  }
}

/** Whether every position is a longitude and a latitude: a file in a projected system has larger numbers. */
function inWgs84Range(coordinates: unknown): boolean {
  if (!Array.isArray(coordinates)) return true
  if (typeof coordinates[0] === "number") {
    const [x, y] = coordinates as Position
    return Math.abs(x) <= 180 && Math.abs(y) <= 90
  }
  return coordinates.every(inWgs84Range)
}

/**
 * The geometry of `kind` in a GeoJSON object. The parts of several features become one multipart geometry, as the
 * server stores lines and polygons (D-035); a point must be one. Other types are refused, not dropped.
 */
export function geometryFromGeoJSON(value: unknown, kind: GeometryKind): Geometry {
  const geometries = geometriesOf(value)
  if (!geometries.length) throw new GeometryFileError("empty")
  const allowed = TYPES_OF_KIND[kind]
  const others = [...new Set(geometries.map((geometry) => geometry.type).filter((type) => !allowed.includes(type)))]
  if (others.length) throw new GeometryFileError("wrongType", { types: others.join(", "), kind })
  if (!geometries.every((geometry) => "coordinates" in geometry && inWgs84Range(geometry.coordinates))) {
    throw new GeometryFileError("outOfRange")
  }
  if (geometries.length === 1) return geometries[0]
  if (kind === "point") throw new GeometryFileError("severalPoints", { count: geometries.length })
  if (kind === "line") {
    const lines: MultiLineString = { type: "MultiLineString", coordinates: [] }
    for (const geometry of geometries) {
      if (geometry.type === "LineString") lines.coordinates.push(geometry.coordinates)
      if (geometry.type === "MultiLineString") lines.coordinates.push(...geometry.coordinates)
    }
    return lines
  }
  const polygons: MultiPolygon = { type: "MultiPolygon", coordinates: [] }
  for (const geometry of geometries) {
    if (geometry.type === "Polygon") polygons.coordinates.push(geometry.coordinates)
    if (geometry.type === "MultiPolygon") polygons.coordinates.push(...geometry.coordinates)
  }
  return polygons
}

// GeoJSON is in WGS84 (RFC 7946); old files may name their system, which must then be WGS84 too.
const WGS84_NAMES = /(CRS84|EPSG:{1,2}4326)$/i

/** Read the geometry of `kind` from a GeoJSON file, or throw a `GeometryFileError`. */
export async function readGeometryFile(file: File, kind: GeometryKind): Promise<Geometry> {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) throw new GeometryFileError("tooLarge", { max: MAX_FILE_SIZE_MB })
  let value: unknown
  try {
    value = JSON.parse(await file.text())
  } catch {
    throw new GeometryFileError("notJSON")
  }
  if (isRecord(value) && isRecord(value.crs)) {
    const name = isRecord(value.crs.properties) ? value.crs.properties.name : undefined
    if (typeof name !== "string" || !WGS84_NAMES.test(name)) {
      throw new GeometryFileError("crs", { crs: typeof name === "string" ? name : "?" })
    }
  }
  return geometryFromGeoJSON(value, kind)
}
