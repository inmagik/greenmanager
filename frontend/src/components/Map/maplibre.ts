// The only module that imports MapLibre: the rest of the map imports it from here, and only the lazy chunks (the map
// page, the small maps of the details) import the map, so MapLibre stays out of the main bundle.
import { setWorkerUrl } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"

// MapLibre 6 looks for its worker next to its own module, which the bundle moves: Vite copies the worker and gives
// its address.
setWorkerUrl(workerUrl)

export { AttributionControl, MapLibreMap, NavigationControl, ScaleControl } from "maplibre-gl"
