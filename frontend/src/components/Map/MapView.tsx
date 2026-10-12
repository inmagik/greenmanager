import { Box, type BoxProps } from "@mantine/core"
import type { TFunction } from "i18next"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { basemapStyle } from "./basemaps"
import type { Bbox } from "./bbox"
import { MapContext } from "./MapContext"
import classes from "./MapView.module.css"
import { AttributionControl, MapLibreMap, NavigationControl, ScaleControl } from "./maplibre"

/** Where the map looks: center (longitude, latitude) and zoom. */
export type MapViewState = { center: [number, number]; zoom: number }

/** The view at the start: a center and a zoom, or a box to fit, not beyond `maxZoom` (e.g. for a point). */
export type InitialView = MapViewState | { bounds: Bbox; maxZoom?: number }

type Props = BoxProps & {
  /** Read once, when the map is created: then the map moves by itself. */
  initialView: InitialView
  /** The basemap at the start, read once: `BasemapSwitcher` changes it. */
  basemap?: string | null
  /** A small map in a page: the wheel zooms with Ctrl (⌘ on a Mac), one finger scrolls the page, no scale. */
  compact?: boolean
  /** The accessible name of the map, read once. */
  label: string
  /** At the end of every move of the map. */
  onViewChange?: (view: MapViewState) => void
  /** Layers and controls, rendered once the map is loaded, with the map in `MapContext`. */
  children?: ReactNode
}

// The texts of MapLibre: the name of the map, which MapLibre gives to its canvas, and its controls.
function mapLocale(t: TFunction, label: string): Record<string, string> {
  return {
    "Map.Title": label,
    "AttributionControl.ToggleAttribution": t("mapView.controls.toggleAttribution"),
    "CooperativeGesturesHandler.WindowsHelpText": t("mapView.controls.cooperativeWindows"),
    "CooperativeGesturesHandler.MacHelpText": t("mapView.controls.cooperativeMac"),
    "CooperativeGesturesHandler.MobileHelpText": t("mapView.controls.cooperativeMobile"),
    "NavigationControl.ZoomIn": t("mapView.controls.zoomIn"),
    "NavigationControl.ZoomOut": t("mapView.controls.zoomOut"),
  }
}

/**
 * A map with the basemaps of the application (`basemaps.ts`), in 2D: no rotation and no tilt. The children add
 * layers and controls with `useMap`. When the width changes, the west edge stays.
 */
export function MapView({ initialView, basemap, compact = false, label, onViewChange, children, ...props }: Props) {
  const { t } = useTranslation()
  const container = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const settings = useRef({ initialView, basemap, compact, locale: mapLocale(t, label) })
  const viewChange = useRef(onViewChange)
  useEffect(() => {
    viewChange.current = onViewChange
  })

  useEffect(() => {
    const { initialView, basemap, compact, locale } = settings.current
    const view =
      "bounds" in initialView
        ? { bounds: initialView.bounds, fitBoundsOptions: { padding: 40, maxZoom: initialView.maxZoom ?? 18 } }
        : { center: initialView.center, zoom: initialView.zoom }
    const instance = new MapLibreMap({
      container: container.current!,
      style: basemapStyle(basemap),
      ...view,
      maxZoom: 21,
      attributionControl: false,
      cooperativeGestures: compact,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      locale,
    })
    instance.touchZoomRotate.disableRotation()
    instance.keyboard.disableRotation()
    instance.addControl(new NavigationControl({ showCompass: false }), "top-right")
    instance.addControl(new AttributionControl({ compact: true }), "bottom-right")
    if (!compact) instance.addControl(new ScaleControl({ unit: "metric" }), "bottom-left")
    instance.on("load", () => setMap(instance))
    // A change of width keeps the west edge where it is, not the center: a panel that opens on the right does not
    // move what the map shows.
    let width = instance.getContainer().clientWidth
    instance.on("resize", () => {
      const change = width - instance.getContainer().clientWidth
      width -= change
      if (change) instance.panBy([-change / 2, 0], { duration: 0 })
    })
    instance.on("moveend", () => {
      const { lng, lat } = instance.getCenter()
      viewChange.current?.({ center: [lng, lat], zoom: instance.getZoom() })
    })
    return () => {
      setMap(null)
      instance.remove()
    }
  }, [])

  return (
    <Box pos="relative" {...props}>
      <div ref={container} className={classes.map} />
      {map && <MapContext.Provider value={map}>{children}</MapContext.Provider>}
    </Box>
  )
}
