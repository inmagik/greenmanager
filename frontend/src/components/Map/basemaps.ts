import type { TFunction } from "i18next"
import type { StyleSpecification } from "maplibre-gl"
import { SLOT_ANCHOR_LAYERS } from "./slots"

/** A WMS that gives its images in EPSG:3857: the map asks it one image for each tile. */
type WMS = {
  /** The address of the service, with or without parameters (e.g. `map=` of MapServer). */
  url: string
  /** The layers, separated by commas. */
  layers: string
  /** `image/jpeg` if not given: an orthophoto has no transparency. */
  format?: string
  version?: "1.1.1" | "1.3.0"
}

/**
 * A basemap: raster tiles (`tiles`, with `{z}/{x}/{y}`) or a WMS (`wms`). The addresses may be relative to the
 * application, for a service behind its proxy (e.g. `/wms/pcn`).
 */
export type Basemap = {
  id: string
  /** The name in the switcher; without it, the translation `mapView.basemaps.<id>`. */
  label?: string
  tiles?: string[]
  wms?: WMS
  attribution?: string
  /** The last zoom with tiles: beyond it the map enlarges those of this zoom. */
  maxzoom?: number
}

/**
 * Without `VITE_BASEMAPS`: OpenStreetMap, for the development, and the orthophoto of the Portale Cartografico
 * Nazionale (2012), which is only on HTTP and goes through the proxy `/wms/pcn` of Vite and of nginx.
 */
const DEFAULT_BASEMAPS: Basemap[] = [
  {
    id: "osm",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    maxzoom: 19,
  },
  {
    id: "pcn",
    wms: {
      url: "/wms/pcn?map=/ms_ogc/WMS_v1.3/raster/ortofoto_colore_12.map",
      layers: "OI.ORTOIMMAGINI.2012.32,OI.ORTOIMMAGINI.2012.33",
    },
    attribution: '© <a href="https://gn.mase.gov.it" target="_blank">Geoportale Nazionale</a>',
    maxzoom: 20,
  },
]

const text = (value: unknown) => typeof value === "string" && value.trim() !== ""
const optional = (value: unknown, check: (value: unknown) => boolean) => value === undefined || check(value)

function isWMS(value: unknown): value is WMS {
  if (!value || typeof value !== "object") return false
  const wms = value as Record<string, unknown>
  return (
    text(wms.url) &&
    text(wms.layers) &&
    optional(wms.format, text) &&
    optional(wms.version, (version) => version === "1.1.1" || version === "1.3.0")
  )
}

// Every field with its type: a wrong one would break the map, instead of giving the default basemaps.
function isBasemap(value: unknown): value is Basemap {
  if (!value || typeof value !== "object") return false
  const basemap = value as Record<string, unknown>
  // Tiles or a WMS, not both.
  const source =
    basemap.wms === undefined
      ? Array.isArray(basemap.tiles) && basemap.tiles.length > 0 && basemap.tiles.every(text)
      : basemap.tiles === undefined && isWMS(basemap.wms)
  return (
    text(basemap.id) &&
    source &&
    optional(basemap.label, text) &&
    optional(basemap.attribution, (attribution) => typeof attribution === "string") &&
    optional(basemap.maxzoom, (zoom) => Number.isInteger(zoom) && (zoom as number) >= 0 && (zoom as number) <= 24)
  )
}

function readBasemaps(): Basemap[] {
  const configured = import.meta.env.VITE_BASEMAPS
  if (!configured) return DEFAULT_BASEMAPS
  try {
    const basemaps: unknown = JSON.parse(configured)
    // The ids name the layers of the map: they are unique.
    if (
      Array.isArray(basemaps) &&
      basemaps.length > 0 &&
      basemaps.every(isBasemap) &&
      new Set(basemaps.map((basemap) => basemap.id)).size === basemaps.length
    ) {
      return basemaps
    }
  } catch {
    // Reported below.
  }
  console.error("VITE_BASEMAPS is not a JSON list of basemaps: the default ones are used.")
  return DEFAULT_BASEMAPS
}

/** The basemaps of the application, from `VITE_BASEMAPS` (a JSON list of `Basemap`) or the default ones. */
export const BASEMAPS = readBasemaps()

export function basemapLabel(basemap: Basemap, t: TFunction) {
  return basemap.label ?? t(`mapView.basemaps.${basemap.id}`, { defaultValue: basemap.id })
}

/** The id of a basemap, or of the first one if it does not exist. */
export function basemapId(id: string | null | undefined): string {
  return BASEMAPS.some((basemap) => basemap.id === id) ? (id as string) : BASEMAPS[0].id
}

export function basemapLayerId(id: string) {
  return `basemap:${id}`
}

// An address relative to the application, with the origin; not through `URL`, which would encode the placeholders
// of MapLibre (`{z}`).
function absolute(url: string) {
  return url.startsWith("/") ? `${window.location.origin}${url}` : url
}

function tileUrls(basemap: Basemap): string[] {
  if (basemap.tiles) return basemap.tiles.map(absolute)
  const { url, layers, format = "image/jpeg", version = "1.1.1" } = basemap.wms!
  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: version,
    REQUEST: "GetMap",
    LAYERS: layers,
    STYLES: "",
    [version === "1.3.0" ? "CRS" : "SRS"]: "EPSG:3857",
    WIDTH: "256",
    HEIGHT: "256",
    FORMAT: format,
  })
  // The placeholder of MapLibre, not encoded.
  return [`${absolute(url)}${url.includes("?") ? "&" : "?"}${params}&BBOX={bbox-epsg-3857}`]
}

/**
 * The style of the map: every basemap as a raster layer, visible only the one chosen, then the empty layers of the
 * slots. A change of basemap changes the visibility of the layers, never the style, which would drop the layers
 * added to it; MapLibre does not load the tiles of the hidden layers.
 */
export function basemapStyle(visible?: string | null): StyleSpecification {
  const active = basemapId(visible)
  return {
    version: 8,
    sources: Object.fromEntries(
      BASEMAPS.map((basemap) => [
        basemapLayerId(basemap.id),
        {
          type: "raster",
          tiles: tileUrls(basemap),
          tileSize: 256,
          attribution: basemap.attribution,
          maxzoom: basemap.maxzoom ?? 19,
        },
      ])
    ),
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#e9ecef" } },
      ...BASEMAPS.map((basemap) => ({
        id: basemapLayerId(basemap.id),
        type: "raster" as const,
        source: basemapLayerId(basemap.id),
        layout: { visibility: basemap.id === active ? ("visible" as const) : ("none" as const) },
      })),
      ...SLOT_ANCHOR_LAYERS,
    ],
  }
}
