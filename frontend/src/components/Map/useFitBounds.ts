import { useEffect, useRef } from "react"
import type { Bbox } from "./bbox"
import { useMap } from "./MapContext"

/**
 * Fit the map to `bounds` when they change, not beyond `maxZoom` (e.g. for a point); not at the start, when the map
 * opens on the initial view of `MapView`.
 */
export function useFitBounds(bounds: Bbox | null, maxZoom = 18) {
  const map = useMap()
  const key = bounds?.join(",") ?? ""
  const first = useRef(key)

  useEffect(() => {
    if (!key || key === first.current) return
    first.current = ""
    map.fitBounds(key.split(",").map(Number) as Bbox, { padding: 40, maxZoom })
  }, [map, key, maxZoom])
}
