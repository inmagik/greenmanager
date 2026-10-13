import type { FeatureCollection } from "geojson"
import type {
  CircleLayerSpecification,
  DistributiveOmit,
  FillLayerSpecification,
  GeoJSONSource,
  LineLayerSpecification,
} from "maplibre-gl"
import { useEffect, useRef } from "react"
import { useMap } from "./MapContext"
import { slotAnchorId, type Slot } from "./slots"

/** A layer of a GeoJSON source, without the source; its `id` is unique in the source. */
export type GeoJSONLayer = DistributiveOmit<
  FillLayerSpecification | LineLayerSpecification | CircleLayerSpecification,
  "source"
>

type Options = {
  /** The features; `null` empties the layers. The `id` property, if any, identifies the features (`promoteId`). */
  data: FeatureCollection | null
  /** Read once: their style does not change. */
  layers: GeoJSONLayer[]
  slot: Slot
  visible?: boolean
}

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] }

/** The id in the map of a layer of a source. */
export function layerId(source: string, layer: string) {
  return `${source}:${layer}`
}

/**
 * A GeoJSON source and its layers, at the top of their slot. The layers are added once, then the data change with
 * `setData` and the visibility with the layout: a layer removed and added again would go to the top of its slot.
 */
export function useGeoJSONLayer(source: string, { data, layers, slot, visible = true }: Options) {
  const map = useMap()
  const specs = useRef(layers)

  useEffect(() => {
    const ids = specs.current.map((layer) => layerId(source, layer.id))
    map.addSource(source, { type: "geojson", data: EMPTY, promoteId: "id" })
    specs.current.forEach((layer, index) =>
      map.addLayer({ ...layer, id: ids[index], source } as FillLayerSpecification, slotAnchorId(slot))
    )
    return () => {
      // The map may be removed already: then it has no layers.
      for (const id of ids) if (map.getLayer(id)) map.removeLayer(id)
      if (map.getSource(source)) map.removeSource(source)
    }
  }, [map, source, slot])

  useEffect(() => {
    map.getSource<GeoJSONSource>(source)?.setData(data ?? EMPTY)
  }, [map, source, data])

  useEffect(() => {
    for (const layer of specs.current) {
      map.setLayoutProperty(layerId(source, layer.id), "visibility", visible ? "visible" : "none")
    }
  }, [map, source, visible])
}
