import { Page } from "@/components/Page"
import { Center, Loader } from "@mantine/core"
import { lazy, Suspense } from "react"

// A lazy page: MapLibre stays in the chunk of the map, out of the main bundle (D-057).
const MapPage = lazy(() => import("./MapPage"))

export function LazyMapPage() {
  return (
    <Suspense
      fallback={
        <Page>
          <Center p="xl">
            <Loader />
          </Center>
        </Page>
      }
    >
      <MapPage />
    </Suspense>
  )
}
