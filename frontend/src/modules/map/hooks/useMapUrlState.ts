import type { MapViewState } from "@/components/Map/MapView"
import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"

export const MAP_LAYERS = ["areas", "elements"] as const
export type MapLayer = (typeof MAP_LAYERS)[number]

/** The feature selected on the map, which the panel shows. */
export type Selection = { kind: "area" | "element"; id: string }

// The latitudes of the Web Mercator projection of MapLibre.
const MAX_LATITUDE = 85.051129

// The view as `zoom/latitude/longitude`, like the links of OpenStreetMap.
function parseView(value: string | null): MapViewState | null {
  const parts = value?.split("/").map(Number)
  if (!parts || parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null
  const [zoom, latitude, longitude] = parts
  if (Math.abs(latitude) > MAX_LATITUDE || zoom < 0 || zoom > 22) return null
  // A longitude beyond ±180 is the same place, in -180..180.
  const wrapped = Math.abs(longitude) <= 180 ? longitude : ((((longitude + 180) % 360) + 360) % 360) - 180
  return { center: [wrapped, latitude], zoom }
}

function formatView({ center: [longitude, latitude], zoom }: MapViewState) {
  return `${zoom.toFixed(2)}/${latitude.toFixed(6)}/${longitude.toFixed(6)}`
}

/**
 * The state of the map in the URL, so a map can be reloaded and shared: view, basemap, visible layers and selected
 * feature. The client is the filter of the lists (`useClientFilter`). A move of the map replaces the entry of the
 * history; a selection adds one, so "back" goes to the one before.
 */
export function useMapUrlState() {
  const [params, setParams] = useSearchParams()

  const update = useCallback(
    (changes: Record<string, string | null>, replace: boolean) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [name, value] of Object.entries(changes)) {
            if (value === null) next.delete(name)
            else next.set(name, value)
          }
          return next
        },
        { replace }
      ),
    [setParams]
  )

  const setView = useCallback((view: MapViewState) => update({ view: formatView(view) }, true), [update])
  const setBasemap = useCallback((basemap: string) => update({ basemap }, true), [update])
  const setLayers = useCallback(
    (visible: MapLayer[]) => update({ layers: MAP_LAYERS.filter((layer) => visible.includes(layer)).join(",") }, true),
    [update]
  )
  const select = useCallback(
    (selected: Selection | null) =>
      update(
        {
          area: selected?.kind === "area" ? selected.id : null,
          element: selected?.kind === "element" ? selected.id : null,
        },
        false
      ),
    [update]
  )

  const layersParam = params.get("layers")
  // Without the parameter, all the layers.
  const layers = useMemo(
    () =>
      layersParam === null ? [...MAP_LAYERS] : MAP_LAYERS.filter((layer) => layersParam.split(",").includes(layer)),
    [layersParam]
  )
  const element = params.get("element")
  const area = params.get("area")
  const selection = useMemo<Selection | null>(
    () => (element ? { kind: "element", id: element } : area ? { kind: "area", id: area } : null),
    [area, element]
  )

  return {
    view: parseView(params.get("view")),
    setView,
    basemap: params.get("basemap"),
    setBasemap,
    layers,
    setLayers,
    selection,
    select,
  }
}
