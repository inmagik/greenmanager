import { bboxParam, geometryBounds, type MergedGeometry } from "@/components/Map"
import { BasemapSwitcher } from "@/components/Map/BasemapSwitcher"
import { GeometryDraw, type DrawControls } from "@/components/Map/draw/GeometryDraw"
import { PointPicker, type PointControls } from "@/components/Map/draw/PointPicker"
import { LocateControl } from "@/components/Map/LocateControl"
import { useMap } from "@/components/Map/MapContext"
import { useFeatureClick } from "@/components/Map/useFeatureClick"
import { useGeoJSONLayer } from "@/components/Map/useGeoJSONLayer"
import { useMapBbox } from "@/components/Map/useMapBbox"
import type { MapLibreMap } from "@/components/Map/maplibre"
import { useHasPermission } from "@/hooks/useHasPermission"
import { useElement, useElementsGeoJSON } from "@/modules/inventory/api/elements"
import { INVENTORY_PERMISSIONS } from "@/modules/inventory/permissions"
import { useArea, useAreasGeoJSON } from "@/modules/territory/api/areas"
import { TERRITORY_PERMISSIONS } from "@/modules/territory/permissions"
import type { GeometryType } from "@/modules/catalogs/types"
import type { FeatureCollection, Geometry, Point } from "geojson"
import { useViewportSize } from "@mantine/hooks"
import { useEffect, useMemo } from "react"
import type { MapLayer, Selection } from "../hooks/useMapUrlState"
import {
  AREA_LAYERS,
  AREAS_MIN_ZOOM,
  AREAS_SOURCE,
  CLICKABLE_LAYERS,
  ELEMENT_LAYERS,
  ELEMENTS_MIN_ZOOM,
  ELEMENTS_SOURCE,
  SELECTION_LAYERS,
  SELECTION_SOURCE,
  PENDING_SOURCE,
} from "../layers"
import { LayersPanel, type LayerStatus } from "./LayersPanel"
import { DRAWER_SHARE } from "./MapSidePanel"

/**
 * What the map frames once its data arrive: the selected feature, or the areas of the client. Without animation when
 * the map opens; with it on a request of the user.
 */
export type FitTarget = { target: "selection" | "client"; animate: boolean } | null

/**
 * The position of a new element, given on the map: the parts of a line or of a polygon drawn with terra-draw, or a
 * point from a tap or the crosshair. The toolbar is in the panel, which gets the controls.
 */
export type MapDrawing = {
  kind: GeometryType
  /** The geometry at the start, read once, e.g. coming back from the form: its parts are edited. */
  initial: Geometry | null
  /** The point shown. */
  point: Point | null
  onChange: (geometry: MergedGeometry | null) => void
  onDrawControls: (controls: DrawControls | null) => void
  onPointControls: (controls: PointControls | null) => void
}

type Props = {
  /** On a phone the panel of the feature is a drawer over the lower part of the map. */
  mobile: boolean
  client: string | null
  onClientChange: (client: string | null) => void
  layers: MapLayer[]
  onLayersChange: (layers: MapLayer[]) => void
  basemap: string | null
  onBasemapChange: (basemap: string) => void
  selection: Selection | null
  onSelect: (selection: Selection | null) => void
  fit: FitTarget
  onFitted: () => void
  /** A new element is being created: the clicks do not select the features. */
  creating: boolean
  /** The position of the new element being given on the map. */
  drawing: MapDrawing | null
  /** The position of a new element, given before: shown like a selected feature. */
  pending: Geometry | null
}

// The part of the map that the drawer of the panel covers on a phone, in pixels: the drawer is a share of the
// screen, from its bottom, and the map is lower than the screen.
function drawerHeight(map: MapLibreMap, mobile: boolean) {
  if (!mobile) return 0
  const drawerTop = window.innerHeight * (1 - DRAWER_SHARE)
  const { top, bottom } = map.getContainer().getBoundingClientRect()
  return Math.max(0, bottom - Math.max(drawerTop, top))
}

// The areas of a client come without a box: zooming in does not show the ones left out.
function areasStatus(layer: LayerStatus, client: string | null): LayerStatus {
  return client && layer === "truncated" ? "tooMany" : layer
}

function status(
  query: { isFetching: boolean; isError: boolean; data?: { truncated: boolean } },
  shown: boolean,
  enabled: boolean
): LayerStatus {
  if (!shown) return "hidden"
  if (!enabled) return "zoomIn"
  if (query.isError) return "error"
  if (query.isFetching) return "loading"
  return query.data?.truncated ? "truncated" : "ready"
}

/**
 * The content of the map page, in `MapView`: the layers of the areas and of the elements, loaded in the visible part of
 * the map from their zoom or, with a client, at any zoom; the selected feature; the panel of the layers; the button
 * of the position.
 */
export function MapContent({
  mobile,
  client,
  onClientChange,
  layers,
  onLayersChange,
  basemap,
  onBasemapChange,
  selection,
  onSelect,
  fit,
  onFitted,
  creating,
  drawing,
  pending,
}: Props) {
  const map = useMap()
  // Rendered again when the screen turns or changes size: the height of the drawer depends on it.
  useViewportSize()
  const { bbox, zoom } = useMapBbox()
  const canReadAreas = useHasPermission(TERRITORY_PERMISSIONS.READ_AREAS)
  const canReadElements = useHasPermission(INVENTORY_PERMISSIONS.READ_ELEMENTS)
  const showAreas = canReadAreas && layers.includes("areas")
  const showElements = canReadElements && layers.includes("elements")

  // The areas of a client all together, which the map frames; without a client, those in the visible part.
  const areasEnabled = !!client || zoom >= AREAS_MIN_ZOOM
  const areas = useAreasGeoJSON(
    client ? { client } : { bbox: bboxParam(bbox) },
    canReadAreas && areasEnabled && (showAreas || fit?.target === "client")
  )
  const elementsEnabled = !!client || zoom >= ELEMENTS_MIN_ZOOM
  const elements = useElementsGeoJSON(
    { bbox: bboxParam(bbox), client: client ?? undefined, removed: "false" },
    showElements && elementsEnabled
  )
  useGeoJSONLayer(AREAS_SOURCE, {
    data: areasEnabled ? (areas.data ?? null) : null,
    layers: AREA_LAYERS,
    slot: "surfaces",
    visible: showAreas,
  })
  useGeoJSONLayer(ELEMENTS_SOURCE, {
    data: elementsEnabled ? (elements.data ?? null) : null,
    layers: ELEMENT_LAYERS,
    slot: "features",
    visible: showElements,
  })

  // The selected feature, from its detail: it shows also when it is not in the layers (e.g. of another client).
  const { data: area, isError: areaError } = useArea(selection?.kind === "area" ? selection.id : undefined)
  const { data: element, isError: elementError } = useElement(selection?.kind === "element" ? selection.id : undefined)
  const selected = selection?.kind === "area" ? area : selection?.kind === "element" ? element : undefined
  const selectedGeometry = selected?.id === selection?.id ? selected?.geometry : undefined
  const selectionData = useMemo<FeatureCollection | null>(
    () =>
      selectedGeometry
        ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: selectedGeometry }] }
        : null,
    [selectedGeometry]
  )
  useGeoJSONLayer(SELECTION_SOURCE, { data: selectionData, layers: SELECTION_LAYERS, slot: "selection" })
  const pendingData = useMemo<FeatureCollection | null>(
    () =>
      pending
        ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: pending }] }
        : null,
    [pending]
  )
  useGeoJSONLayer(PENDING_SOURCE, { data: pendingData, layers: SELECTION_LAYERS, slot: "selection" })

  useFeatureClick(
    CLICKABLE_LAYERS,
    (feature, event) => {
      const id = feature?.properties.id as string | undefined
      if (!feature || !id) return onSelect(null)
      onSelect({ kind: feature.source === AREAS_SOURCE ? "area" : "element", id })
      // On a phone the feature goes in the middle of the part above the drawer.
      if (mobile) map.easeTo({ center: event.lngLat, offset: [0, -drawerHeight(map, mobile) / 2] })
    },
    !creating
  )

  // Frame the selected feature, or the areas of the client, once they are loaded.
  const clientAreas = client && !areas.isPlaceholderData ? areas.data : undefined
  useEffect(() => {
    const animate = fit?.animate ?? false
    if (fit?.target === "selection") {
      if (selectedGeometry) {
        const bounds = geometryBounds(selectedGeometry)
        if (bounds) {
          const padding = { top: 60, right: 60, left: 60, bottom: 60 + drawerHeight(map, mobile) }
          map.fitBounds(bounds, { padding, maxZoom: 19, animate })
        }
        onFitted()
      } else if (!selection || areaError || elementError) onFitted()
    } else if (fit?.target === "client") {
      if (!client || !canReadAreas || areas.isError) onFitted()
      else if (clientAreas) {
        const bounds = geometryBounds(clientAreas.features.map((feature) => feature.geometry))
        if (bounds) map.fitBounds(bounds, { padding: 40, maxZoom: 18, animate })
        onFitted()
      }
    }
  }, [
    fit,
    map,
    mobile,
    onFitted,
    selectedGeometry,
    selection,
    areaError,
    elementError,
    client,
    canReadAreas,
    areas.isError,
    clientAreas,
  ])

  return (
    <>
      <LayersPanel
        client={client}
        onClientChange={onClientChange}
        layers={layers}
        onLayersChange={onLayersChange}
        areas={canReadAreas ? areasStatus(status(areas, showAreas, areasEnabled), client) : null}
        elements={canReadElements ? status(elements, showElements, elementsEnabled) : null}
        basemapSwitcher={<BasemapSwitcher value={basemap} onChange={onBasemapChange} />}
      />
      <LocateControl />
      {drawing &&
        (drawing.kind === "point" ? (
          <PointPicker
            value={drawing.point}
            onChange={drawing.onChange}
            onControls={drawing.onPointControls}
            coveredBottom={drawerHeight(map, mobile)}
          />
        ) : (
          <GeometryDraw
            key={drawing.kind}
            kind={drawing.kind}
            initial={drawing.initial}
            onChange={drawing.onChange}
            onControls={drawing.onDrawControls}
          />
        ))}
    </>
  )
}
