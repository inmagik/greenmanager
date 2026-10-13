import { useEffect, useRef, useState } from "react"
import {
  TerraDraw,
  TerraDrawLineStringMode,
  TerraDrawModeUndoRedo,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  TerraDrawSessionUndoRedo,
  ValidateNotSelfIntersecting,
  type GeoJSONStoreFeatures,
} from "terra-draw"
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter"
import { useMap } from "../MapContext"
import { slotAnchorId } from "../slots"
import { DRAW_PRECISION } from "./multipart"

/** The kinds that terra-draw draws: a point is placed with `PointPicker`. */
export type DrawnKind = "line" | "polygon"

export const SELECT_MODE = "select"

/** The terra-draw mode that draws each kind. */
export const DRAW_MODES: Record<DrawnKind, string> = { line: "linestring", polygon: "polygon" }

// The color of a geometry not saved yet, as in the small map (`MiniMap`).
const COLOR = "#e8590c"
const SELECTED_COLOR = "#d9480f"
const WHITE = "#ffffff"

// A polygon must not cross itself, which the server refuses (`geometry_invalid`); a line may.
function notSelfIntersecting(feature: GeoJSONStoreFeatures) {
  return feature.geometry.type === "Polygon" ? ValidateNotSelfIntersecting(feature) : { valid: true }
}

function createModes(kind: DrawnKind) {
  const vertex = {
    coordinatePointColor: WHITE,
    coordinatePointOutlineColor: COLOR,
    coordinatePointWidth: 5,
    coordinatePointOutlineWidth: 2,
    closingPointColor: WHITE,
    closingPointOutlineColor: COLOR,
    closingPointWidth: 7,
    closingPointOutlineWidth: 3,
  } as const
  const drawMode =
    kind === "line"
      ? new TerraDrawLineStringMode({
          modeName: DRAW_MODES.line,
          showCoordinatePoints: true,
          styles: { lineStringColor: COLOR, lineStringWidth: 4, ...vertex },
        })
      : new TerraDrawPolygonMode({
          modeName: DRAW_MODES.polygon,
          showCoordinatePoints: true,
          validation: notSelfIntersecting,
          styles: { fillColor: COLOR, fillOpacity: 0.2, outlineColor: COLOR, outlineWidth: 3, ...vertex },
        })
  const selectMode = new TerraDrawSelectMode({
    modeName: SELECT_MODE,
    // A part does not move as a whole, which a finger would do by mistake: its vertices do.
    flags: {
      [DRAW_MODES[kind]]: {
        feature: {
          draggable: false,
          validation: notSelfIntersecting,
          coordinates: { draggable: true, midpoints: true, deletable: true },
        },
      },
    },
    keyEvents: { deselect: "Escape", delete: null, rotate: null, scale: null },
    styles: {
      selectedLineStringColor: SELECTED_COLOR,
      selectedLineStringWidth: 5,
      selectedPolygonColor: SELECTED_COLOR,
      selectedPolygonFillOpacity: 0.3,
      selectedPolygonOutlineColor: SELECTED_COLOR,
      selectedPolygonOutlineWidth: 4,
      // The vertices, bigger than on a desktop map: they are dragged with a finger.
      selectionPointColor: WHITE,
      selectionPointOutlineColor: SELECTED_COLOR,
      selectionPointWidth: 7,
      selectionPointOutlineWidth: 3,
      midPointColor: SELECTED_COLOR,
      midPointOutlineColor: WHITE,
      midPointWidth: 5,
      midPointOutlineWidth: 2,
    },
  })
  return { drawMode, selectMode }
}

export type TerraDrawInstance = {
  instance: TerraDraw
  /** The mode that draws a new part; `onKeyUp` with Enter finishes the part, with Escape cancels it. */
  drawMode: TerraDrawLineStringMode | TerraDrawPolygonMode
}

/**
 * terra-draw on the map of `MapView`, to draw and edit lines or polygons: a mode that draws a new part, and a select
 * mode in which the vertices of the selected part move, with the undo of the changes. The layers of terra-draw go
 * in the `drawing` slot. `onReady`, read once, gets the instance when it is ready, to load the features and listen to
 * its events; the instance stops with the component.
 */
export function useTerraDraw(kind: DrawnKind, onReady: (draw: TerraDrawInstance) => void) {
  const map = useMap()
  const [draw, setDraw] = useState<TerraDrawInstance>()
  const ready = useRef(onReady)

  useEffect(() => {
    const { drawMode, selectMode } = createModes(kind)
    const instance = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({
        map,
        coordinatePrecision: DRAW_PRECISION,
        renderBelowLayerId: slotAnchorId("drawing"),
        prefixId: "draw",
      }),
      modes: [selectMode, drawMode],
      undoRedo: { modeLevel: new TerraDrawModeUndoRedo(), sessionLevel: new TerraDrawSessionUndoRedo() },
    })
    instance.on("ready", () => {
      ready.current({ instance, drawMode })
      setDraw({ instance, drawMode })
    })
    instance.start()
    return () => {
      setDraw(undefined)
      // The map may be removed already, with the layers of terra-draw.
      if (map.getStyle()) instance.stop()
    }
  }, [map, kind])

  return draw
}
