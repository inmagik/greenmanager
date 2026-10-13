import { ActionIcon, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import type { FeatureCollection } from "geojson"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbCurrentLocation } from "react-icons/tb"
import { circlePolygon } from "./circle"
import classes from "./LocateControl.module.css"
import { useMap } from "./MapContext"
import { useGeoJSONLayer, type GeoJSONLayer } from "./useGeoJSONLayer"
import { useGeolocation } from "./useGeolocation"

const COLOR = "#1c7ed6"

const LAYERS: GeoJSONLayer[] = [
  {
    id: "accuracy",
    type: "fill",
    filter: ["==", ["get", "kind"], "accuracy"],
    paint: { "fill-color": COLOR, "fill-opacity": 0.12, "fill-outline-color": COLOR },
  },
  {
    id: "position",
    type: "circle",
    filter: ["==", ["get", "kind"], "position"],
    paint: { "circle-radius": 7, "circle-color": COLOR, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 },
  },
]

// The zoom of the first position: a street with its trees.
const LOCATE_ZOOM = 17

/**
 * The button "my position", over the map under the zoom: it follows the position of the device and shows it with the
 * circle of its accuracy. The first position centers the map; the next ones only move the point.
 */
export function LocateControl() {
  const { t } = useTranslation()
  const map = useMap()
  const [enabled, setEnabled] = useState(false)
  const { position, error } = useGeolocation(enabled)
  const centered = useRef(false)

  const data = useMemo<FeatureCollection | null>(() => {
    if (!position) return null
    const center: [number, number] = [position.longitude, position.latitude]
    return {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { kind: "accuracy" }, geometry: circlePolygon(center, position.accuracy) },
        { type: "Feature", properties: { kind: "position" }, geometry: { type: "Point", coordinates: center } },
      ],
    }
  }, [position])
  useGeoJSONLayer("user-position", { data, layers: LAYERS, slot: "position" })

  useEffect(() => {
    if (!position || centered.current) return
    centered.current = true
    map.easeTo({ center: [position.longitude, position.latitude], zoom: Math.max(map.getZoom(), LOCATE_ZOOM) })
  }, [map, position])

  useEffect(() => {
    if (error) notifications.show({ color: "red", message: t(`geolocation.errors.${error}`) })
  }, [error, t])

  const label = t(enabled ? "mapView.locate.stop" : "mapView.locate.start")
  return (
    <Tooltip label={label} position="left" events={{ hover: true, focus: true, touch: false }}>
      <ActionIcon
        className={classes.control}
        variant={enabled ? "filled" : "default"}
        color={error ? "red" : undefined}
        size="lg"
        aria-label={label}
        aria-pressed={enabled}
        onClick={() => {
          centered.current = false
          setEnabled((value) => !value)
        }}
      >
        <TbCurrentLocation size={20} />
      </ActionIcon>
    </Tooltip>
  )
}
