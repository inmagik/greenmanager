import { Loader, SimpleGrid, Stack, Text } from "@mantine/core"
import type { Geometry } from "geojson"
import { useTranslation } from "react-i18next"
import { formatLength, formatSurface } from "./format"

type Measures = {
  surface_m2?: string | number
  perimeter_m?: string | number
  length_m?: string | number | null
}

type Props = {
  geometry: Geometry
  /** From the server, on the ellipsoid: of a saved record, or of `geometry-check/` before saving. */
  measures?: Measures
  /** The measures are being computed. */
  loading?: boolean
}

/** Parts of a geometry, and holes of its polygons. */
function structure(geometry: Geometry): { parts: number; holes: number } {
  switch (geometry.type) {
    case "Polygon":
      return { parts: 1, holes: geometry.coordinates.length - 1 }
    case "MultiPolygon":
      return {
        parts: geometry.coordinates.length,
        holes: geometry.coordinates.reduce((holes, polygon) => holes + polygon.length - 1, 0),
      }
    case "MultiLineString":
    case "MultiPoint":
      return { parts: geometry.coordinates.length, holes: 0 }
    case "GeometryCollection":
      return { parts: geometry.geometries.length, holes: 0 }
    default:
      return { parts: 1, holes: 0 }
  }
}

function Value({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap={0}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500} component="div">
        {children}
      </Text>
    </Stack>
  )
}

/** Type, parts and measures of a geometry, without a map. */
export function GeometrySummary({ geometry, measures, loading = false }: Props) {
  const { t } = useTranslation()
  const { parts, holes } = structure(geometry)
  const kind = geometry.type.replace("Multi", "")
  const measure = (value: string | number | null | undefined, format: (value: string | number) => string) =>
    loading ? <Loader size="xs" /> : value === undefined || value === null ? "—" : format(value)

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
      <Value label={t("geometry.type")}>
        {t(parts > 1 ? `geometry.multipartTypes.${kind}` : `geometry.types.${kind}`, { defaultValue: geometry.type })}
      </Value>
      <Value label={t("geometry.parts")}>{holes ? t("geometry.partsWithHoles", { parts, count: holes }) : parts}</Value>
      {kind === "Polygon" && (
        <>
          <Value label={t("geometry.surface")}>{measure(measures?.surface_m2, formatSurface)}</Value>
          <Value label={t("geometry.perimeter")}>{measure(measures?.perimeter_m, formatLength)}</Value>
        </>
      )}
      {kind === "LineString" && <Value label={t("geometry.length")}>{measure(measures?.length_m, formatLength)}</Value>}
    </SimpleGrid>
  )
}
