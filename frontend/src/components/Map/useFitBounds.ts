import { useEffect, useRef } from "react"
import type { Bbox } from "./bbox"
import { useMap } from "./MapContext"

/**
 * Fit the map to `bounds` when they differ from `initial`, the box of the initial view of `MapView`, and when they
 * change; not beyond `maxZoom` (e.g. for a point).
 */
export function useFitBounds(bounds: Bbox | null, initial: Bbox | null, maxZoom = 18) {
  const map = useMap()
  const key = bounds?.join(",") ?? ""
  // The map opened on `initial`: the bounds may have changed while it loaded.
  const first = useRef(initial?.join(",") ?? "")

  useEffect(() => {
    if (!key || key === first.current) return
    first.current = ""
    map.fitBounds(key.split(",").map(Number) as Bbox, { padding: 40, maxZoom })
  }, [map, key, maxZoom])
}
