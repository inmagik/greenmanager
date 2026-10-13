import type { GeoJSONLayer } from "@/components/Map/useGeoJSONLayer"
import { layerId } from "@/components/Map/useGeoJSONLayer"
import type { ElementCategory } from "@/modules/catalogs/types"
import type { ExpressionSpecification } from "maplibre-gl"

/** The areas load from this zoom, the elements from the next one, or at any zoom with a client in the filter. */
export const AREAS_MIN_ZOOM = 12
export const ELEMENTS_MIN_ZOOM = 15

export const AREAS_SOURCE = "areas"
export const ELEMENTS_SOURCE = "elements"
export const SELECTION_SOURCE = "selection"
/** The position of a new element, while its form is open. */
export const PENDING_SOURCE = "pending"

/** The colors of the elements, by the category of their class. */
export const CATEGORY_COLORS: Record<ElementCategory, string> = {
  vegetation: "#2f9e44",
  furniture: "#e67700",
  play: "#ae3ec9",
  facility: "#0b7285",
  other: "#868e96",
}

const AREA_COLOR = "#0ca678"
const SELECTION_COLOR = "#f76707"
const PROVISIONAL_COLOR = "#fab005"

const categoryColor = [
  "match",
  ["get", "category"],
  ...Object.entries(CATEGORY_COLORS).flat(),
  CATEGORY_COLORS.other,
] as unknown as ExpressionSpecification

const isPolygon: ExpressionSpecification = ["==", ["geometry-type"], "Polygon"]
const isPoint: ExpressionSpecification = ["==", ["geometry-type"], "Point"]
const isProvisional: ExpressionSpecification = ["==", ["get", "location_status"], "provisional"]

export const AREA_LAYERS: GeoJSONLayer[] = [
  { id: "fill", type: "fill", paint: { "fill-color": AREA_COLOR, "fill-opacity": 0.08 } },
  {
    id: "outline",
    type: "line",
    paint: {
      "line-color": AREA_COLOR,
      "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 18, 2.5],
    },
  },
]

export const ELEMENT_LAYERS: GeoJSONLayer[] = [
  { id: "fill", type: "fill", filter: isPolygon, paint: { "fill-color": categoryColor, "fill-opacity": 0.3 } },
  {
    id: "line",
    type: "line",
    filter: ["!", isPoint],
    paint: { "line-color": categoryColor, "line-width": ["case", isPolygon, 1.5, 3] },
  },
  {
    id: "point",
    type: "circle",
    filter: isPoint,
    paint: {
      "circle-color": categoryColor,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2, 15, 4, 18, 7, 21, 10],
      // A provisional position has a yellow border.
      "circle-stroke-color": ["case", isProvisional, PROVISIONAL_COLOR, "#ffffff"],
      "circle-stroke-width": ["case", isProvisional, 2, 1],
    },
  },
]

export const SELECTION_LAYERS: GeoJSONLayer[] = [
  { id: "fill", type: "fill", filter: isPolygon, paint: { "fill-color": SELECTION_COLOR, "fill-opacity": 0.12 } },
  { id: "line", type: "line", filter: ["!", isPoint], paint: { "line-color": SELECTION_COLOR, "line-width": 4 } },
  {
    id: "point",
    type: "circle",
    filter: isPoint,
    paint: {
      "circle-radius": 11,
      "circle-color": "rgba(0, 0, 0, 0)",
      "circle-stroke-color": SELECTION_COLOR,
      "circle-stroke-width": 3,
    },
  },
]

/** The layers that a click selects, by priority: the elements above the areas, the points above the polygons. */
export const CLICKABLE_LAYERS = [
  layerId(ELEMENTS_SOURCE, "point"),
  layerId(ELEMENTS_SOURCE, "line"),
  layerId(ELEMENTS_SOURCE, "fill"),
  layerId(AREAS_SOURCE, "fill"),
]
