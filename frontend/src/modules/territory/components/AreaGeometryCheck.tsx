import { AlertError } from "@/components/AlertError"
import { GeometrySummary } from "@/components/Geometry"
import { WarningsAlert } from "@/components/WarningsAlert"
import { apiErrorMessage } from "@/utils"
import { Stack, Text } from "@mantine/core"
import type { MultiPolygon, Polygon } from "geojson"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useAreaGeometryCheck } from "../api/areas"

type Props = {
  geometry: Polygon | MultiPolygon
  client: string | null
  /** The area being changed: it gives the values not sent, and stays out of the overlaps. */
  area?: string
  /** Values of the form that change the overlaps; undefined: those of the area, or from today for a new one. */
  managementStart?: string | null
  managementEnd?: string | null
  isFictitious?: boolean
}

/** A perimeter not saved yet: its measures and warnings from `geometry-check/`, with the values of the form. */
export function AreaGeometryCheck({ geometry, client, area, managementStart, managementEnd, isFictitious }: Props) {
  const { t } = useTranslation()
  const check = useMemo(
    () =>
      client
        ? {
            client,
            geometry,
            area,
            management_start: managementStart,
            management_end: managementEnd,
            is_fictitious: isFictitious,
          }
        : null,
    [client, geometry, area, managementStart, managementEnd, isFictitious]
  )
  const { data, error, isLoading } = useAreaGeometryCheck(check)

  return (
    <Stack gap="sm">
      <GeometrySummary geometry={geometry} measures={data} loading={!!check && isLoading} />
      {!client && (
        <Text size="sm" c="dimmed">
          {t("territory.geometryCheck.chooseClient")}
        </Text>
      )}
      {error && <AlertError title={t("territory.geometryCheck.error")} message={apiErrorMessage(error)} />}
      {data && <WarningsAlert warnings={data.warnings} />}
    </Stack>
  )
}
