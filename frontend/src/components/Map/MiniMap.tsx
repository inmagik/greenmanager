import type { FeatureCollection, Geometry } from "geojson"
import type { ExpressionSpecification } from "maplibre-gl"
import { useMemo, useState } from "react"
import type { Bbox } from "./bbox"
import { geometryBounds } from "./bbox"
import { MapView } from "./MapView"
import { useFitBounds } from "./useFitBounds"
import { useGeoJSONLayer, type GeoJSONLayer } from "./useGeoJSONLayer"

/** A geometry of a small map: the one saved, or a new one before the save, drawn dashed in another color. */
export type MiniMapGeometry = { geometry: Geometry; proposed?: boolean }

export type MiniMapProps = {
  geometries: MiniMapGeometry[]
  /** The accessible name of the map. */
  label: string
  h?: number
}

const SAVED = "#2f9e44"
const PROPOSED = "#e8590c"
const color: ExpressionSpecification = ["case", ["get", "proposed"], PROPOSED, SAVED]

const LAYERS: GeoJSONLayer[] = [
  {
    id: "fill",
    type: "fill",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "fill-color": color, "fill-opacity": 0.2 },
  },
  {
    id: "line",
    type: "line",
    filter: ["!=", ["geometry-type"], "Point"],
    paint: {
      "line-color": color,
      "line-width": 2.5,
      "line-dasharray": ["case", ["get", "proposed"], ["literal", [2, 1.5]], ["literal", [1, 0]]],
    },
  },
  {
    id: "point",
    type: "circle",
    filter: ["==", ["geometry-type"], "Point"],
    paint: { "circle-radius": 7, "circle-color": color, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 },
  },
]

// Italy, when there is nothing to show.
const ITALY = { center: [12.5, 42.2] as [number, number], zoom: 5 }

function Geometries({ geometries, initial }: { geometries: MiniMapGeometry[]; initial: Bbox | null }) {
  const data = useMemo<FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: geometries.map(({ geometry, proposed = false }) => ({
        type: "Feature",
        properties: { proposed },
        geometry,
      })),
    }),
    [geometries]
  )
  useGeoJSONLayer("mini-map", { data, layers: LAYERS, slot: "features" })
  useFitBounds(geometryBounds(geometries.map(({ geometry }) => geometry)), initial)
  return null
}

/**
 * A small map in a detail, with the geometries of a record. Loaded lazily, with MapLibre, through `LazyMiniMap`
 * (exported as `MiniMap` by `@/components/Map`).
 */
export default function MiniMap({ geometries, label, h = 280 }: MiniMapProps) {
  // The box of the initial view, which MapView reads once.
  const [initial] = useState(() => geometryBounds(geometries.map(({ geometry }) => geometry)))
  return (
    <MapView
      compact
      h={h}
      label={label}
      initialView={initial ? { bounds: initial, maxZoom: 18 } : ITALY}
      style={{ borderRadius: "var(--mantine-radius-sm)", overflow: "hidden" }}
    >
      <Geometries geometries={geometries} initial={initial} />
    </MapView>
  )
}
