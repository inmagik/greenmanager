import type { Geometry, Position } from "geojson"

/** A bounding box in WGS84: `[west, south, east, north]`, in degrees. */
export type Bbox = [number, number, number, number]

const WORLD: Bbox = [-180, -90, 180, 90]

/** The box within the limits of WGS84, which the server checks (`bbox_invalid`). */
export function clampBbox([west, south, east, north]: Bbox): Bbox {
  return [Math.max(west, WORLD[0]), Math.max(south, WORLD[1]), Math.min(east, WORLD[2]), Math.min(north, WORLD[3])]
}

/**
 * The box enlarged to a grid that depends on the zoom: a step is the width of a tile at that zoom. Small moves of the
 * map give the same box, so the data already loaded serve them; the box stays within the limits of WGS84.
 */
export function snapBbox([west, south, east, north]: Bbox, zoom: number): Bbox {
  const step = 360 / 2 ** Math.max(Math.floor(zoom), 0)
  return clampBbox([
    Math.floor(west / step) * step,
    Math.floor(south / step) * step,
    Math.ceil(east / step) * step,
    Math.ceil(north / step) * step,
  ])
}

/** The `bbox` parameter of the `geojson/` actions: `minx,miny,maxx,maxy`. */
export function bboxParam(bbox: Bbox): string {
  return bbox.map((value) => Number(value.toFixed(6))).join(",")
}

function positions(geometry: Geometry): Position[] {
  switch (geometry.type) {
    case "Point":
      return [geometry.coordinates]
    case "MultiPoint":
    case "LineString":
      return geometry.coordinates
    case "MultiLineString":
    case "Polygon":
      return geometry.coordinates.flat()
    case "MultiPolygon":
      return geometry.coordinates.flat(2)
    case "GeometryCollection":
      return geometry.geometries.flatMap(positions)
  }
}

/** The box of one or more geometries, `null` without positions. */
export function geometryBounds(geometries: Geometry | Geometry[]): Bbox | null {
  const all = (Array.isArray(geometries) ? geometries : [geometries]).flatMap(positions)
  if (all.length === 0) return null
  const bbox: Bbox = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [x, y] of all) {
    bbox[0] = Math.min(bbox[0], x)
    bbox[1] = Math.min(bbox[1], y)
    bbox[2] = Math.max(bbox[2], x)
    bbox[3] = Math.max(bbox[3], y)
  }
  return bbox
}
