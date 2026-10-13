import { Skeleton } from "@mantine/core"
import { lazy, Suspense } from "react"
import type { MiniMapProps } from "./MiniMap"

const MiniMap = lazy(() => import("./MiniMap"))

/** The small map of the details: MapLibre loads only when a detail shows one. */
export function LazyMiniMap(props: MiniMapProps) {
  return (
    <Suspense fallback={<Skeleton h={props.h ?? 280} radius="sm" />}>
      <MiniMap {...props} />
    </Suspense>
  )
}
