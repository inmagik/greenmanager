import type { Geometry, LineString, MultiLineString, MultiPolygon, Point, Polygon, Position } from "geojson"

/** The decimals of the coordinates that terra-draw keeps, and the map gives: about a tenth of a millimeter. */
export const DRAW_PRECISION = 9

/** What a geometry is made of: a point, lines or polygons (the `geometry_type` of the element classes). */
export type DrawKind = "point" | "line" | "polygon"

/** A part of a geometry, as terra-draw edits it: terra-draw has no multipart geometries. */
export type Part = Point | LineString | Polygon

/** The geometry made of the parts: lines and polygons are always multipart, as the server stores them. */
export type MergedGeometry = Point | MultiLineString | MultiPolygon

export type SplitParts = {
  /** The parts terra-draw edits, with the coordinates rounded to its precision. */
  editable: Part[]
  /** The parts terra-draw does not edit, the polygons with holes: they stay as they are. */
  locked: Part[]
  /**
   * The parts as they were, by the key of their rounded coordinates (`partKey`): a part not touched keeps its
   * coordinates, which the rounding would change by less than a millimeter.
   */
  originals: Map<string, Part>
}

const KIND_TYPES: Record<DrawKind, Part["type"]> = { point: "Point", line: "LineString", polygon: "Polygon" }

function round(value: number, precision: number) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function roundPosition(position: Position, precision: number): Position {
  // Only longitude and latitude: terra-draw has no elevation.
  return [round(position[0], precision), round(position[1], precision)]
}

function roundPart(part: Part, precision: number): Part {
  switch (part.type) {
    case "Point":
      return { type: "Point", coordinates: roundPosition(part.coordinates, precision) }
    case "LineString":
      return { type: "LineString", coordinates: part.coordinates.map((position) => roundPosition(position, precision)) }
    case "Polygon":
      return {
        type: "Polygon",
        coordinates: part.coordinates.map((ring) => ring.map((position) => roundPosition(position, precision))),
      }
  }
}

/** The key of a part by its coordinates, to find the original of a part not touched. */
export function partKey(part: Part): string {
  return `${part.type}:${JSON.stringify(part.coordinates)}`
}

/** The parts of a geometry, simple or multipart; none for another type of geometry. */
export function geometryParts(geometry: Geometry | null | undefined): Part[] {
  if (!geometry) return []
  switch (geometry.type) {
    case "Point":
    case "LineString":
    case "Polygon":
      return [geometry]
    case "MultiPoint":
      return geometry.coordinates.map((coordinates) => ({ type: "Point", coordinates }))
    case "MultiLineString":
      return geometry.coordinates.map((coordinates) => ({ type: "LineString", coordinates }))
    case "MultiPolygon":
      return geometry.coordinates.map((coordinates) => ({ type: "Polygon", coordinates }))
    case "GeometryCollection":
      return geometry.geometries.flatMap(geometryParts)
  }
}

/**
 * Split a geometry into its parts, for terra-draw, which edits each one as a feature: the coordinates rounded to its
 * `precision`, the polygons with holes apart, since terra-draw does not take them. Only the parts of `kind`.
 */
export function splitParts(geometry: Geometry | null | undefined, kind: DrawKind, precision: number): SplitParts {
  const result: SplitParts = { editable: [], locked: [], originals: new Map() }
  for (const part of geometryParts(geometry)) {
    if (part.type !== KIND_TYPES[kind]) continue
    if (part.type === "Polygon" && part.coordinates.length > 1) {
      result.locked.push(part)
      continue
    }
    const rounded = roundPart(part, precision)
    result.editable.push(rounded)
    result.originals.set(partKey(rounded), part)
  }
  return result
}

/**
 * Join the parts into the geometry to save: a point, or a multipart line or polygon. The parts not touched get back
 * their original coordinates (`originals` of `splitParts`); the locked ones follow, as they are. Only the parts of
 * `kind`; `null` without parts, and for a point the last one.
 */
export function mergeParts(
  kind: DrawKind,
  parts: Part[],
  { originals, locked = [] }: { originals?: Map<string, Part>; locked?: Part[] } = {}
): MergedGeometry | null {
  const all = [...parts.map((part) => originals?.get(partKey(part)) ?? part), ...locked].filter(
    (part) => part.type === KIND_TYPES[kind]
  )
  if (all.length === 0) return null
  if (kind === "point") return all[all.length - 1] as Point
  if (kind === "line") {
    return { type: "MultiLineString", coordinates: (all as LineString[]).map((line) => line.coordinates) }
  }
  return { type: "MultiPolygon", coordinates: (all as Polygon[]).map((polygon) => polygon.coordinates) }
}

// The side of `c` from the line through `a` and `b`: 1 on the left, -1 on the right, 0 on the line.
function side(a: Position, b: Position, c: Position) {
  return Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]))
}

// Two segments that cross in a point inside both: touching at an end, or lying on the same line, is not crossing.
function segmentsCross(a: Position, b: Position, c: Position, d: Position) {
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0
}

function segments(polygon: Polygon): [Position, Position][] {
  return polygon.coordinates.flatMap((ring) =>
    ring.slice(1).map((end, index): [Position, Position] => [ring[index], end])
  )
}

function onSegment(point: Position, [a, b]: [Position, Position]) {
  return (
    side(a, b, point) === 0 &&
    point[0] >= Math.min(a[0], b[0]) &&
    point[0] <= Math.max(a[0], b[0]) &&
    point[1] >= Math.min(a[1], b[1]) &&
    point[1] <= Math.max(a[1], b[1])
  )
}

// Two sides on the same line that share a stretch, not only an end.
function sidesShare([a, b]: [Position, Position], [c, d]: [Position, Position]) {
  if (side(a, b, c) !== 0 || side(a, b, d) !== 0) return false
  // Along the axis where the side is longer.
  const axis = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]) ? 0 : 1
  const start = Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis]))
  const end = Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis]))
  return start < end
}

function insideRing([x, y]: Position, ring: Position[]) {
  let inside = false
  for (let index = 1; index < ring.length; index++) {
    const [x1, y1] = ring[index - 1]
    const [x2, y2] = ring[index]
    if (y1 > y !== y2 > y && x < x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)) inside = !inside
  }
  return inside
}

// Inside the polygon and not on its boundary: in the shell and out of the holes.
function strictlyInside(point: Position, polygon: Polygon) {
  if (segments(polygon).some((segment) => onSegment(point, segment))) return false
  const [shell, ...holes] = polygon.coordinates
  return insideRing(point, shell) && !holes.some((hole) => insideRing(point, hole))
}

function polygonsOverlap(a: Polygon, b: Polygon) {
  const sidesA = segments(a)
  const sidesB = segments(b)
  if (sidesA.some((sideA) => sidesB.some((sideB) => segmentsCross(...sideA, ...sideB) || sidesShare(sideA, sideB)))) {
    return true
  }
  // Without sides crossing or in common, one is inside the other if one of its vertices, or the middle of a side, is.
  const probes = (sides: [Position, Position][]) =>
    sides.flatMap(([p, q]): Position[] => [p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]])
  return (
    probes(sidesA).some((point) => strictlyInside(point, b)) || probes(sidesB).some((point) => strictlyInside(point, a))
  )
}

/**
 * Whether two polygons among the parts overlap, or have a stretch of side in common: the server refuses such a
 * multipart polygon (`geometry_invalid`). Two parts that touch in a point do not overlap. A check on the plane of the
 * coordinates, which guides the drawing: the server makes the real one.
 */
export function partsOverlap(parts: Part[]): boolean {
  const polygons = parts.filter((part): part is Polygon => part.type === "Polygon")
  return polygons.some((polygon, index) => polygons.slice(index + 1).some((other) => polygonsOverlap(polygon, other)))
}
