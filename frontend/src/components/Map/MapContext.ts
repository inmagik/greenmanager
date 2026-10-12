import type { MapLibreMap } from "maplibre-gl"
import { createContext, useContext } from "react"

/** The map of `MapView`, once its style is loaded. */
export const MapContext = createContext<MapLibreMap | null>(null)

/** The map, in the children of `MapView`. */
export function useMap(): MapLibreMap {
  const map = useContext(MapContext)
  if (!map) throw new Error("useMap must be used in the children of MapView")
  return map
}
