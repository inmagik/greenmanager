import { Button, Group, Stack, Text } from "@mantine/core"
import type { FeatureCollection, Geometry, Point } from "geojson"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbCrosshair } from "react-icons/tb"
import { geometryBounds, type Bbox } from "./bbox"
import { BasemapSwitcher } from "./BasemapSwitcher"
import { DrawToolbar } from "./draw/DrawToolbar"
import { GeometryDraw, type DrawControls } from "./draw/GeometryDraw"
import type { DrawKind, MergedGeometry } from "./draw/multipart"
import { PointPicker, type PointControls } from "./draw/PointPicker"
import classes from "./GeometryEditor.module.css"
import { LocateControl } from "./LocateControl"
import { MapView } from "./MapView"
import { useFitBounds } from "./useFitBounds"
import { useGeoJSONLayer, type GeoJSONLayer } from "./useGeoJSONLayer"

export type GeometryEditorProps = {
  kind: DrawKind
  /** The geometry at the start, read once: its parts are edited; without it, the first part is drawn. */
  initial: Geometry | null
  /** Geometries to draw over, e.g. the saved one: green, under the edited one. The map frames them at the start. */
  context?: Geometry[]
  /** The new geometry, at the end of each change: `null` when no part is left. */
  onChange: (geometry: MergedGeometry | null) => void
  /** The accessible name of the map. */
  label: string
  h?: number | string
}

const CONTEXT_COLOR = "#2f9e44"

const CONTEXT_LAYERS: GeoJSONLayer[] = [
  {
    id: "fill",
    type: "fill",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "fill-color": CONTEXT_COLOR, "fill-opacity": 0.1 },
  },
  {
    id: "line",
    type: "line",
    filter: ["!=", ["geometry-type"], "Point"],
    paint: { "line-color": CONTEXT_COLOR, "line-width": 2 },
  },
  {
    id: "point",
    type: "circle",
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-radius": 6,
      "circle-color": CONTEXT_COLOR,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  },
]

// Italy, when there is nothing to frame.
const ITALY = { center: [12.5, 42.2] as [number, number], zoom: 5 }

function Context({ geometries, initial }: { geometries: Geometry[]; initial: Bbox | null }) {
  const data = useMemo<FeatureCollection | null>(
    () =>
      geometries.length > 0
        ? {
            type: "FeatureCollection",
            features: geometries.map((geometry) => ({ type: "Feature", properties: {}, geometry })),
          }
        : null,
    [geometries]
  )
  useGeoJSONLayer("editor-context", { data, layers: CONTEXT_LAYERS, slot: "surfaces" })
  // Geometries that arrive later, e.g. the area of a new element once it is chosen.
  useFitBounds(
    useMemo(() => geometryBounds(geometries), [geometries]),
    initial,
    19
  )
  return null
}

/**
 * A map that draws or edits one geometry: the parts of a line or of a polygon with terra-draw (`GeometryDraw`), or a
 * point with a tap or the crosshair (`PointPicker`). The buttons are above the map; the position of the user and the
 * basemap are over it. Loaded lazily, with MapLibre and terra-draw, through `LazyGeometryEditor` (exported as
 * `GeometryEditor` by `@/components/Map`).
 */
export default function GeometryEditor({ kind, initial, context = [], onChange, label, h = 420 }: GeometryEditorProps) {
  const { t } = useTranslation()
  const [controls, setControls] = useState<DrawControls | null>(null)
  const [pointControls, setPointControls] = useState<PointControls | null>(null)
  const [point, setPoint] = useState<Point | null>(initial?.type === "Point" ? initial : null)
  const [basemap, setBasemap] = useState<string | null>(null)
  // The box of the initial view, which MapView reads once.
  const [bounds] = useState(() => geometryBounds(initial ? [initial, ...context] : context))

  return (
    <Stack gap="xs">
      {kind === "point" ? (
        <Group gap="xs" justify="space-between">
          <Text size="sm" c="dimmed">
            {t("draw.hints.point")}
          </Text>
          <Button
            size="sm"
            variant="default"
            leftSection={<TbCrosshair />}
            disabled={!pointControls}
            onClick={() => pointControls?.placeAtCrosshair()}
          >
            {t("draw.placeAtCrosshair")}
          </Button>
        </Group>
      ) : (
        <DrawToolbar controls={controls} />
      )}
      <MapView
        h={h}
        label={label}
        initialView={bounds ? { bounds, maxZoom: 19 } : ITALY}
        style={{ borderRadius: "var(--mantine-radius-sm)", overflow: "hidden" }}
      >
        <Context geometries={context} initial={bounds} />
        {kind === "point" ? (
          <PointPicker
            value={point}
            onChange={(value) => {
              setPoint(value)
              onChange(value)
            }}
            onControls={setPointControls}
          />
        ) : (
          <GeometryDraw key={kind} kind={kind} initial={initial} onChange={onChange} onControls={setControls} />
        )}
        <LocateControl />
        <div className={classes.basemap}>
          <BasemapSwitcher compact value={basemap} onChange={setBasemap} />
        </div>
      </MapView>
    </Stack>
  )
}
