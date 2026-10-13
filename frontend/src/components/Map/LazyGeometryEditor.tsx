import { Skeleton } from "@mantine/core"
import { lazy, Suspense } from "react"
import type { GeometryEditorProps } from "./GeometryEditor"

const GeometryEditor = lazy(() => import("./GeometryEditor"))

/** The geometry editor: MapLibre and terra-draw load only when a page edits a geometry on the map. */
export function LazyGeometryEditor(props: GeometryEditorProps) {
  return (
    <Suspense fallback={<Skeleton h={props.h ?? 420} radius="sm" />}>
      <GeometryEditor {...props} />
    </Suspense>
  )
}
