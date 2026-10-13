import { AlertError } from "@/components/AlertError"
import { FormFooter } from "@/components/FormFooter"
import { GeometryFileInput, GeometrySummary } from "@/components/Geometry"
import { GeometryEditor, MiniMap, type MiniMapGeometry } from "@/components/Map"
import { RevisionConflictAlert } from "@/components/RevisionConflictAlert"
import { transformErrorsForForm } from "@/utils"
import { isRevisionConflict } from "@/utils/tracking"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Button, Group, SegmentedControl, Stack, Text } from "@mantine/core"
import type { MultiPolygon, Polygon } from "geojson"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbDeviceFloppy } from "react-icons/tb"
import { useUpdateArea } from "../api/areas"
import type { Area } from "../types"
import { AreaGeometryCheck } from "./AreaGeometryCheck"

type Props = {
  area: Area
  /** Give the area a new geometry: edited on the map, or from a file. */
  editable: boolean
  onDone: () => void
  /** Reload the area after a revision conflict; the parent remounts the panel with the new revision. */
  onReload: () => void
}

type Mode = "map" | "file"

/**
 * The geometry of an area: type, parts and measures, with the small map. In edit mode, the parts move, are added and
 * deleted on the map (`GeometryEditor`), or a file replaces them; before saving, `geometry-check/` gives the measures
 * and warnings of the new geometry with the other values of the area.
 */
export function AreaGeometryPanel({ area, editable, onDone, onReload }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>("map")
  // The new geometry; on the map, `null` also when its parts are all deleted.
  const [geometry, setGeometry] = useState<Polygon | MultiPolygon | null>(null)
  const [emptied, setEmptied] = useState(false)
  // A part being drawn is not in the geometry yet: saving would lose it.
  const [drawing, setDrawing] = useState(false)
  // The geometry read from a file, before the save, next to the saved one; on the map the editor shows both.
  const miniMapGeometries = useMemo<MiniMapGeometry[]>(
    () => [{ geometry: area.geometry }, ...(geometry ? [{ geometry, proposed: true }] : [])],
    [area.geometry, geometry]
  )
  const context = useMemo(() => [area.geometry], [area.geometry])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [conflict, setConflict] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { mutateAsync: updateArea } = useUpdateArea()

  const change = (value: Polygon | MultiPolygon | null) => {
    setGeometry(value)
    setErrors({})
  }
  const cancel = () => {
    setGeometry(null)
    setEmptied(false)
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
  const otherErrors = Object.entries(errors).filter(([field]) => field !== "geometry" || mode === "map")
  const onMap = editable && mode === "map"

  return (
    <Stack justify="space-between" h="100%">
      <Stack gap="lg" p="xl">
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {t("territory.geometry.current")}
          </Text>
          <GeometrySummary geometry={area.geometry} measures={area} />
          {/* On the map the editor shows the saved geometry under the new one. */}
          {!onMap && <MiniMap label={t("territory.geometry.mapLabel")} geometries={miniMapGeometries} />}
        </Stack>
        {editable && (
          <Stack gap="xs">
            <Text fw={600} size="sm">
              {t("territory.geometry.newGeometry")}
            </Text>
            <SegmentedControl
              aria-label={t("territory.geometry.modeLabel")}
              data={(["map", "file"] as const).map((value) => ({
                value,
                label: t(`territory.geometry.modes.${value}`),
              }))}
              value={mode}
              onChange={(value) => {
                setMode(value as Mode)
                change(null)
                setEmptied(false)
              }}
              style={{ alignSelf: "flex-start" }}
            />
            {conflict && <RevisionConflictAlert onReload={onReload} />}
            {otherErrors.length > 0 && (
              <AlertError
                title={t("common.errorTitle")}
                message={otherErrors.map(([, message]) => message).join(" ")}
              />
            )}
            {mode === "map" ? (
              <GeometryEditor
                kind="polygon"
                initial={area.geometry}
                context={context}
                label={t("territory.geometry.editorLabel")}
                onChange={(value) => {
                  change(value as MultiPolygon | null)
                  setEmptied(!value)
                }}
                onDrawing={setDrawing}
              />
            ) : (
              <GeometryFileInput
                kind="polygon"
                withAsterisk
                label={t("territory.fields.geometryFile")}
                description={t("territory.fields.geometryFileDescription")}
                onChange={(value) => change(value as Polygon | MultiPolygon | null)}
                error={errors.geometry}
              />
            )}
            {emptied && mode === "map" && (
              <Text size="sm" c="red">
                {t("territory.geometry.noParts")}
              </Text>
            )}
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
            <Button leftSection={<TbDeviceFloppy />} loading={isLoading} disabled={!geometry || drawing} onClick={save}>
              {t("common.save")}
            </Button>
          </Group>
        </FormFooter>
      )}
    </Stack>
  )
}
