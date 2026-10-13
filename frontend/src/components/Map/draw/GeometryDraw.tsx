import type { FeatureCollection, Geometry } from "geojson"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { GeoJSONStoreFeatures } from "terra-draw"
import { useGeoJSONLayer, type GeoJSONLayer } from "../useGeoJSONLayer"
import {
  DRAW_PRECISION,
  mergeParts,
  partKey,
  partsOverlap,
  splitParts,
  type MergedGeometry,
  type Part,
} from "./multipart"
import { DRAW_MODES, SELECT_MODE, useTerraDraw, type DrawnKind, type TerraDrawInstance } from "./useTerraDraw"

/** What the drawing does now, and its actions: for a toolbar outside the map (`DrawToolbar`). */
export type DrawControls = {
  kind: DrawnKind
  /** A new part is being drawn. */
  drawing: boolean
  /** The part being drawn has the vertices it needs: two for a line, three for a polygon. */
  canFinish: boolean
  /** The part being drawn has vertices: they are not in the geometry until the part is finished. */
  unfinished: boolean
  /** A part is selected: "delete part" removes it. */
  selected: boolean
  /** The finished parts that terra-draw edits. */
  parts: number
  /** The parts that terra-draw does not edit (polygons with holes): they stay as they are. */
  locked: number
  /** Two polygons overlap: the server would refuse the geometry. */
  overlap: boolean
  canUndo: boolean
  addPart: () => void
  finishPart: () => void
  cancelPart: () => void
  deletePart: () => void
  undo: () => void
}

type Props = {
  kind: DrawnKind
  /** The geometry at the start, read once: its parts are edited. Without it, the first part is drawn. */
  initial: Geometry | null
  /** The geometry made of the parts, at the end of each change (not at the start): `null` without parts. */
  onChange: (geometry: MergedGeometry | null) => void
  /** The controls, at each change; `null` when the drawing ends. */
  onControls: (controls: DrawControls | null) => void
}

const LOCKED_COLOR = "#868e96"

const LOCKED_LAYERS: GeoJSONLayer[] = [
  { id: "fill", type: "fill", paint: { "fill-color": LOCKED_COLOR, "fill-opacity": 0.2 } },
  {
    id: "line",
    type: "line",
    paint: { "line-color": LOCKED_COLOR, "line-width": 3, "line-dasharray": [2, 1.5] },
  },
]

const KEY_EVENT = { heldKeys: [], preventDefault: () => {} }

const MIN_VERTICES: Record<DrawnKind, number> = { line: 2, polygon: 3 }

const PART_TYPES: Record<DrawnKind, Part["type"]> = { line: "LineString", polygon: "Polygon" }

// A part, finished or being drawn: the points that guide the drawing (the vertices, the closing points) have its mode
// too.
function isPart(feature: GeoJSONStoreFeatures, kind: DrawnKind) {
  return feature.properties.mode === DRAW_MODES[kind] && feature.geometry.type === PART_TYPES[kind]
}

// The vertices placed in a part being drawn: terra-draw counts them for a polygon, not for a line, which has one
// coordinate more, the one that follows the pointer.
function placedVertices(feature: GeoJSONStoreFeatures) {
  if (feature.geometry.type === "LineString") return Math.max(feature.geometry.coordinates.length - 1, 0)
  return Number(feature.properties.committedCoordinateCount ?? 0)
}

/**
 * The parts of a line or of a polygon, drawn and edited on the map of `MapView` with terra-draw: each part is a
 * feature (`splitParts`), and the geometry joins them again (`mergeParts`). Tapping a part selects it and shows its
 * vertices, which move by dragging; dragging the middle of a side adds a vertex, and a right click on a vertex removes
 * it. A new part is drawn with `addPart`. The polygons with holes, which terra-draw does not edit, stay as they are,
 * in grey. Two polygons that overlap are told (`overlap`), not refused: the server refuses them.
 */
export function GeometryDraw({ kind, initial, onChange, onControls }: Props) {
  // `kind` and `initial` are read once: a drawing of another kind is another component (`key`).
  const [split] = useState(() => splitParts(initial, kind, DRAW_PRECISION))
  const [locked, setLocked] = useState<Part[]>(split.locked)
  const lockedRef = useRef(locked)
  const [drawing, setDrawing] = useState(false)
  // The vertices placed in the part being drawn.
  const [vertices, setVertices] = useState(0)
  const [selected, setSelected] = useState<string | number | null>(null)
  const [parts, setParts] = useState(0)
  const [overlap, setOverlap] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const handlers = useRef({ onChange, onControls })
  useEffect(() => {
    handlers.current = { onChange, onControls }
  })

  const emit = useCallback(
    ({ instance }: TerraDrawInstance) => {
      // The finished parts: not the one being drawn.
      const finished = instance
        .getSnapshot()
        .filter((feature) => isPart(feature, kind) && !feature.properties.currentlyDrawing)
        .map((feature) => feature.geometry as Part)
      setParts(finished.length)
      setOverlap(partsOverlap([...finished, ...lockedRef.current]))
      handlers.current.onChange(mergeParts(kind, finished, { originals: split.originals, locked: lockedRef.current }))
    },
    [kind, split]
  )

  const draw = useTerraDraw(kind, (ready) => {
    const { instance } = ready
    const results = instance.addFeatures(
      split.editable.map((geometry) => ({ type: "Feature", geometry, properties: { mode: DRAW_MODES[kind] } }))
    )
    // A part that terra-draw refuses stays as it was, like the polygons with holes.
    const refused = split.editable.filter((_, index) => !results[index]?.valid)
    if (refused.length > 0) {
      lockedRef.current = [...split.locked, ...refused.map((part) => split.originals.get(partKey(part)) ?? part)]
      setLocked(lockedRef.current)
    }
    instance.clearUndoRedoHistory()
    // `finish` ends each change: a part drawn, and in the select mode a vertex dragged (`dragCoordinate`), added
    // from the middle of a side (`insertMidpoint`) or removed (`deleteCoordinate`).
    instance.on("finish", (_id, context) => {
      if (context.mode === DRAW_MODES[kind]) {
        instance.setMode(SELECT_MODE)
        setDrawing(false)
      }
      emit(ready)
    })
    // The part being drawn, whose vertices are counted.
    let drawnId: string | number | null = null
    instance.on("change", (ids, type) => {
      for (const id of ids) {
        if (type === "delete") {
          // Undoing the first vertex removes the part.
          if (id === drawnId) {
            drawnId = null
            setVertices(0)
          }
          continue
        }
        const feature = instance.getSnapshotFeature(id)
        if (feature && isPart(feature, kind) && feature.properties.currentlyDrawing) {
          drawnId = id
          setVertices(placedVertices(feature))
        }
      }
    })
    instance.on("select", (id) => setSelected(id))
    instance.on("deselect", () => setSelected(null))
    instance.on("history", () => setCanUndo(instance.canUndo()))
    // Without parts to edit, the first one is drawn. The geometry at the start is not a change.
    const editable = split.editable.length - refused.length
    const empty = editable === 0 && lockedRef.current.length === 0
    instance.setMode(empty ? DRAW_MODES[kind] : SELECT_MODE)
    setDrawing(empty)
    setParts(editable)
  })

  const controls = useMemo<DrawControls>(
    () => ({
      kind,
      drawing,
      canFinish: drawing && vertices >= MIN_VERTICES[kind],
      unfinished: drawing && vertices > 0,
      selected: selected !== null,
      parts,
      locked: locked.length,
      overlap,
      canUndo,
      addPart: () => {
        if (!draw) return
        draw.instance.setMode(DRAW_MODES[kind])
        setSelected(null)
        setDrawing(true)
        setVertices(0)
      },
      finishPart: () => draw?.drawMode.onKeyUp({ key: "Enter", ...KEY_EVENT }),
      cancelPart: () => {
        if (!draw) return
        draw.drawMode.onKeyUp({ key: "Escape", ...KEY_EVENT })
        setVertices(0)
        // Without other parts there is nothing to edit: the drawing goes on.
        if (parts + locked.length === 0) return
        draw.instance.setMode(SELECT_MODE)
        setDrawing(false)
      },
      deletePart: () => {
        if (!draw || selected === null) return
        draw.instance.deselectFeature(selected)
        draw.instance.removeFeatures([selected])
        setSelected(null)
        emit(draw)
      },
      undo: () => {
        if (!draw) return
        draw.instance.undo()
        emit(draw)
      },
    }),
    [kind, drawing, vertices, selected, parts, locked, overlap, canUndo, draw, emit]
  )
  useEffect(() => {
    handlers.current.onControls(controls)
  }, [controls])
  // The actions of a stopped drawing do nothing.
  useEffect(() => () => handlers.current.onControls(null), [])

  const lockedData = useMemo<FeatureCollection | null>(
    () =>
      locked.length > 0
        ? {
            type: "FeatureCollection",
            features: locked.map((geometry) => ({ type: "Feature", properties: {}, geometry })),
          }
        : null,
    [locked]
  )
  useGeoJSONLayer("draw-locked", { data: lockedData, layers: LOCKED_LAYERS, slot: "drawing" })
  return null
}
