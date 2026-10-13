import type { GeometryType } from "@/modules/catalogs/types"
import type { TFunction } from "i18next"
import type { LineString, MultiLineString, MultiPolygon, Point, Polygon } from "geojson"
import * as yup from "yup"
import type { ElementGeometryInput, ElementPosition } from "./types"

/**
 * How the form gives the position: coordinates of a point, typed or read from the device; the center of the area (a
 * point, provisional); a geometry drawn on the map (a point, lines or polygons); lines or polygons from a file.
 */
export type PositionMode = "coordinates" | "area_center" | "map" | "file"

export type PositionValue = {
  mode: PositionMode
  /** Values of the number inputs: a number, or a text while it is typed. */
  latitude: number | string
  longitude: number | string
  /** The accuracy the device declared, while the coordinates are those it gave; `null` when typed. */
  gpsAccuracy: number | null
  /** A geometry drawn on the map, or a line or a polygon read from a file. */
  geometry: Point | LineString | MultiLineString | Polygon | MultiPolygon | null
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

/** An empty position for the type of geometry of a class: coordinates for a point, the map for the others. */
export function emptyPosition(geometryType: GeometryType | undefined): PositionValue {
  return {
    mode: !geometryType || geometryType === "point" ? "coordinates" : "map",
    latitude: "",
    longitude: "",
    gpsAccuracy: null,
    geometry: null,
  }
}

/** The geometry of a complete position, to check it; none at the center of the area, which the server gives. */
export function positionGeometry(value: PositionValue): ElementGeometryInput | null {
  if (value.mode === "file" || value.mode === "map") return value.geometry
  if (value.mode !== "coordinates") return null
  const { latitude, longitude } = value
  if (!isNumber(latitude) || !isNumber(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return { type: "Point", coordinates: [longitude, latitude] }
}

/**
 * The position to send. Typed coordinates have no source: they may come from an instrument, and only the position of
 * the device is `gps` (§3.4 of 04-modello-dati.md). A position given in the form is verified, except at the center of
 * the area, where the server makes it provisional.
 */
export function positionPayload(value: PositionValue): ElementPosition {
  if (value.mode === "area_center") {
    return { location_source: "area_center", location_accuracy_m: null }
  }
  const geometry = positionGeometry(value) ?? undefined
  if (value.mode === "file" || value.mode === "map") {
    const source = value.mode === "file" ? "import" : "map"
    return { geometry, location_source: source, location_accuracy_m: null, location_status: "verified" }
  }
  const fromDevice = value.gpsAccuracy !== null
  return {
    geometry,
    location_source: fromDevice ? "gps" : "",
    // The server keeps two decimals.
    location_accuracy_m: fromDevice ? Math.round(value.gpsAccuracy! * 100) / 100 : null,
    location_status: "verified",
  }
}

/** The checks of a position in the form, under its field (`position.latitude`, `position.geometry`…). */
export function positionSchema(t: TFunction) {
  const coordinate = (max: number, message: string) =>
    yup.mixed().when("mode", {
      is: "coordinates",
      then: (schema) =>
        schema
          .test("required", t("inventory.validation.coordinates"), (value) => value !== "" && value !== null)
          .test("range", message, (value) => value === "" || (isNumber(value) && Math.abs(value) <= max)),
    })
  return yup.object({
    mode: yup.string(),
    latitude: coordinate(90, t("inventory.validation.latitude")),
    longitude: coordinate(180, t("inventory.validation.longitude")),
    geometry: yup
      .mixed()
      .nullable()
      .when("mode", {
        is: (mode: PositionMode) => mode === "file" || mode === "map",
        then: (schema) => schema.required(t("inventory.validation.geometry")),
      }),
  })
}
