import { useEffect, useState } from "react"
import { snapBbox, type Bbox } from "./bbox"
import { useMap } from "./MapContext"
import type { MapLibreMap } from "./maplibre"

type MapBbox = {
  /** The visible part of the map, enlarged to the grid of `snapBbox`: small moves give the same box. */
  bbox: Bbox
  zoom: number
}

function read(map: MapLibreMap): MapBbox {
  const zoom = map.getZoom()
  const bounds = map.getBounds()
  return { bbox: snapBbox([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], zoom), zoom }
}

/** The box and the zoom of the map, for the `bbox` of the `geojson/` actions; they change at the end of a move. */
export function useMapBbox(): MapBbox {
  const map = useMap()
  const [state, setState] = useState(() => read(map))

  useEffect(() => {
    const update = () =>
      setState((current) => {
        const next = read(map)
        // The same box keeps the same object, and the queries of the layers do not change.
        const same = next.zoom === current.zoom && next.bbox.every((value, index) => value === current.bbox[index])
        return same ? current : next
      })
    map.on("moveend", update)
    return () => {
      map.off("moveend", update)
    }
  }, [map])

  return state
}
