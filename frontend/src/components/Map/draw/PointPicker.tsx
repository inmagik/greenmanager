import type { FeatureCollection, Point } from "geojson"
import type { MapMouseEvent } from "maplibre-gl"
import { useEffect, useMemo, useRef } from "react"
import { TbPlus } from "react-icons/tb"
import { useMap } from "../MapContext"
import { useGeoJSONLayer, type GeoJSONLayer } from "../useGeoJSONLayer"
import { DRAW_PRECISION } from "./multipart"
import classes from "./PointPicker.module.css"

/** The actions of the point, for a toolbar outside the map. */
export type PointControls = {
  /** Put the point under the crosshair, in the middle of the visible part of the map. */
  placeAtCrosshair: () => void
  /** Show a position given from outside, e.g. from the device: the map goes there. */
  show: (point: Point) => void
}

type Props = {
  value: Point | null
  /** A point from a tap on the map or from the crosshair. */
  onChange: (point: Point) => void
  /** The controls; `null` when the picker ends. */
  onControls: (controls: PointControls | null) => void
  /** The pixels at the bottom of the map that a panel covers: the crosshair is in the middle of the rest. */
  coveredBottom?: number
}

const COLOR = "#e8590c"

const LAYERS: GeoJSONLayer[] = [
  {
    id: "point",
    type: "circle",
    paint: { "circle-radius": 8, "circle-color": COLOR, "circle-stroke-color": "#ffffff", "circle-stroke-width": 3 },
  },
]

// The zoom at which a point given from outside is shown: a street with its trees.
const SHOW_ZOOM = 18

const round = (value: number) => Number(value.toFixed(DRAW_PRECISION))

/**
 * The position of a point on the map of `MapView`: a tap puts it where the finger is, and `placeAtCrosshair` under
 * the crosshair in the middle of the map, which is more precise with a finger.
 */
export function PointPicker({ value, onChange, onControls, coveredBottom = 0 }: Props) {
  const map = useMap()
  const handlers = useRef({ onChange, onControls })
  useEffect(() => {
    handlers.current = { onChange, onControls }
  })

  useEffect(() => {
    const click = (event: MapMouseEvent) =>
      handlers.current.onChange({ type: "Point", coordinates: [round(event.lngLat.lng), round(event.lngLat.lat)] })
    map.on("click", click)
    map.getCanvas().style.cursor = "crosshair"
    return () => {
      map.off("click", click)
      map.getCanvas().style.cursor = ""
    }
  }, [map])

  useEffect(() => {
    handlers.current.onControls({
      placeAtCrosshair: () => {
        const { clientWidth, clientHeight } = map.getContainer()
        const { lng, lat } = map.unproject([clientWidth / 2, (clientHeight - coveredBottom) / 2])
        handlers.current.onChange({ type: "Point", coordinates: [round(lng), round(lat)] })
      },
      show: (point) =>
        map.easeTo({
          center: point.coordinates as [number, number],
          zoom: Math.max(map.getZoom(), SHOW_ZOOM),
          offset: [0, -coveredBottom / 2],
        }),
    })
  }, [map, coveredBottom])
  useEffect(() => () => handlers.current.onControls(null), [])

  const data = useMemo<FeatureCollection | null>(
    () =>
      value ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: value }] } : null,
    [value]
  )
  useGeoJSONLayer("draw-point", { data, layers: LAYERS, slot: "drawing" })

  return (
    <div className={classes.crosshair} style={{ bottom: coveredBottom }} aria-hidden>
      <TbPlus size={36} />
    </div>
  )
}
