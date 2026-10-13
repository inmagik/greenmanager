// Only what does not load MapLibre: any page may import it. The map itself (`MapView`, the layers, the controls, the
// drawing) is imported by its path, and only from the lazy chunks: the page `/map`, `MiniMap` and `GeometryEditor`.
export { bboxParam, geometryBounds, snapBbox, type Bbox } from "./bbox"
export type { DrawKind, MergedGeometry } from "./draw/multipart"
export type { GeometryEditorProps } from "./GeometryEditor"
export { LazyGeometryEditor as GeometryEditor } from "./LazyGeometryEditor"
export { LazyMiniMap as MiniMap } from "./LazyMiniMap"
export type { MiniMapGeometry } from "./MiniMap"
export { useGeoJSON, type GeoJSONResponse } from "./useGeoJSON"
