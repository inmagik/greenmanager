import type { MapGeoJSONFeature, MapMouseEvent, PointLike } from "maplibre-gl"
import { useEffect, useRef } from "react"
import { useMap } from "./MapContext"

// Pixels around the click or the tap: a point is small under a finger.
const TOLERANCE = 8

/**
 * Clicks on the map: the feature under the pointer, of the first of `layers` that has one (the order is the
 * priority, e.g. the elements before the areas), or `null` where there is none, with the event of the click. On the
 * layers the pointer is a hand.
 */
export function useFeatureClick(
  layers: string[],
  onClick: (feature: MapGeoJSONFeature | null, event: MapMouseEvent) => void
) {
  const map = useMap()
  const handler = useRef(onClick)
  useEffect(() => {
    handler.current = onClick
  })
  const key = layers.join(" ")

  useEffect(() => {
    const ids = key.split(" ")
    const click = (event: MapMouseEvent) => {
      const { x, y } = event.point
      const box: [PointLike, PointLike] = [
        [x - TOLERANCE, y - TOLERANCE],
        [x + TOLERANCE, y + TOLERANCE],
      ]
      const present = ids.filter((id) => map.getLayer(id))
      const features = present.length > 0 ? map.queryRenderedFeatures(box, { layers: present }) : []
      const feature = ids.map((id) => features.find((candidate) => candidate.layer.id === id)).find(Boolean)
      handler.current(feature ?? null, event)
    }
    const enter = () => {
      map.getCanvas().style.cursor = "pointer"
    }
    const leave = () => {
      map.getCanvas().style.cursor = ""
    }
    map.on("click", click)
    map.on("mouseenter", ids, enter)
    map.on("mouseleave", ids, leave)
    return () => {
      map.off("click", click)
      map.off("mouseenter", ids, enter)
      map.off("mouseleave", ids, leave)
    }
  }, [map, key])
}
