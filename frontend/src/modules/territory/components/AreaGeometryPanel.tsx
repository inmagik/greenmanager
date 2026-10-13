import { AlertError } from "@/components/AlertError"
import { FormFooter } from "@/components/FormFooter"
import { GeometryFileInput, GeometrySummary } from "@/components/Geometry"
import { MiniMap, type MiniMapGeometry } from "@/components/Map"
import { RevisionConflictAlert } from "@/components/RevisionConflictAlert"
import { transformErrorsForForm } from "@/utils"
import { isRevisionConflict } from "@/utils/tracking"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Button, Group, Stack, Text } from "@mantine/core"
import type { MultiPolygon, Polygon } from "geojson"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbDeviceFloppy } from "react-icons/tb"
import { useUpdateArea } from "../api/areas"
import type { Area } from "../types"
import { AreaGeometryCheck } from "./AreaGeometryCheck"

type Props = {
  area: Area
  /** Replace the geometry with one from a file. */
  editable: boolean
  onDone: () => void
  /** Reload the area after a revision conflict; the parent remounts the panel with the new revision. */
  onReload: () => void
}

/**
 * The geometry of an area, without a map: type, parts and measures. In edit mode, a file replaces it; before saving,
 * `geometry-check/` gives its measures and warnings with the other values of the area.
 */
export function AreaGeometryPanel({ area, editable, onDone, onReload }: Props) {
  const { t } = useTranslation()
  const [geometry, setGeometry] = useState<Polygon | MultiPolygon | null>(null)
  // The perimeter read from a file, before the save, next to the saved one.
  const miniMapGeometries = useMemo<MiniMapGeometry[]>(
    () => [{ geometry: area.geometry }, ...(geometry ? [{ geometry, proposed: true }] : [])],
    [area.geometry, geometry]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [conflict, setConflict] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { mutateAsync: updateArea } = useUpdateArea()

  const cancel = () => {
    setGeometry(null)
    setErrors({})
    setConflict(false)
    onDone()
  }
  const save = async () => {
    if (!geometry) {
      setErrors({ geometry: t("territory.validation.geometry") })
      return
    }
    setIsLoading(true)
    try {
      await updateArea({ id: area.id, revision: area.revision, geometry })
      setGeometry(null)
      onDone()
    } catch (error) {
      if (isRevisionConflict(error)) setConflict(true)
      else
        setErrors(
          error instanceof ApiError
            ? transformErrorsForForm(error.data)
            : { non_field_errors: t("common.unexpectedError") }
        )
    } finally {
      setIsLoading(false)
    }
  }
  const otherErrors = Object.entries(errors).filter(([field]) => field !== "geometry")

  return (
    <Stack justify="space-between" h="100%">
      <Stack gap="lg" p="xl">
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {t("territory.geometry.current")}
          </Text>
          <GeometrySummary geometry={area.geometry} measures={area} />
          <MiniMap label={t("territory.geometry.mapLabel")} geometries={miniMapGeometries} />
        </Stack>
        {editable && (
          <Stack gap="xs">
            <Text fw={600} size="sm">
              {t("territory.geometry.replace")}
            </Text>
            {conflict && <RevisionConflictAlert onReload={onReload} />}
            {otherErrors.length > 0 && (
              <AlertError
                title={t("common.errorTitle")}
                message={otherErrors.map(([, message]) => message).join(" ")}
              />
            )}
            <GeometryFileInput
              kind="polygon"
              withAsterisk
              label={t("territory.fields.geometryFile")}
              description={t("territory.fields.geometryFileDescription")}
              onChange={(value) => {
                setGeometry(value as Polygon | MultiPolygon | null)
                setErrors({})
              }}
              error={errors.geometry}
            />
            {geometry && <AreaGeometryCheck geometry={geometry} client={area.client} area={area.id} />}
          </Stack>
        )}
      </Stack>
      {editable && (
        <FormFooter>
          <Group justify="space-between" p="sm" className="standard-border-top">
            <Button variant="subtle" color="gray.7" onClick={cancel}>
              {t("common.cancel")}
            </Button>
            <Button leftSection={<TbDeviceFloppy />} loading={isLoading} disabled={!geometry} onClick={save}>
              {t("common.save")}
            </Button>
          </Group>
        </FormFooter>
      )}
    </Stack>
  )
}
