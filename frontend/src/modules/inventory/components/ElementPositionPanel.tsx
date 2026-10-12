import { AlertError } from "@/components/AlertError"
import { CheckPermission } from "@/components/CheckPermission"
import { FormFooter } from "@/components/FormFooter"
import { GeometrySummary } from "@/components/Geometry"
import { RevisionConflictAlert } from "@/components/RevisionConflictAlert"
import { areaLabel } from "@/modules/territory/components/areaModals"
import { notifyApiError, transformErrorsForForm } from "@/utils"
import { isRevisionConflict } from "@/utils/tracking"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Alert, Badge, Button, Group, SimpleGrid, Stack, Text } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDebouncedValue } from "@mantine/hooks"
import { yupResolver } from "mantine-form-yup-resolver"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbDeviceFloppy, TbMapPinCheck } from "react-icons/tb"
import * as yup from "yup"
import { useUpdateElement } from "../api/elements"
import { INVENTORY_PERMISSIONS } from "../permissions"
import { emptyPosition, positionGeometry, positionPayload, positionSchema, type PositionValue } from "../position"
import type { Element } from "../types"
import { ElementGeometryCheck } from "./ElementGeometryCheck"
import { notifyPositionWarnings } from "./elementWarnings"
import { PositionInput } from "./PositionInput"

type Props = {
  element: Element
  /** Give the element a new position. */
  editable: boolean
  onDone: () => void
  /** Reload the element after a revision conflict; the parent remounts the panel with the new revision. */
  onReload: () => void
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

type Area = { id: string; code: string; name: string }

/**
 * The position of an element, without a map: the coordinates of a point, or the parts and measures of a line or a
 * polygon, with its status and source. In edit mode, a new position from coordinates, the device, the center of the
 * area or a file; before saving, `geometry-check/` gives its measures, the proposed area and the warnings. A
 * provisional position not at the center of the area can be confirmed as it is.
 */
export function ElementPositionPanel({ element, editable, onDone, onReload }: Props) {
  const { t } = useTranslation()
  const geometryType = element.element_class_data.geometry_type
  const [area, setArea] = useState<Area>(element.area_data)
  const [conflict, setConflict] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { mutateAsync: updateElement } = useUpdateElement()
  const form = useForm<{ position: PositionValue }>({
    mode: "controlled",
    initialValues: { position: emptyPosition(geometryType) },
    validate: yupResolver(yup.object({ position: positionSchema(t) })),
  })
  const [position] = useDebouncedValue(form.values.position, 400)
  const { mode, latitude, longitude, geometry: fileGeometry } = position
  const geometry = useMemo(
    () => positionGeometry({ mode, latitude, longitude, gpsAccuracy: null, geometry: fileGeometry }),
    [mode, latitude, longitude, fileGeometry]
  )
  const chooseArea = useCallback((suggested: Area) => setArea(suggested), [])

  const save = async (data: Parameters<typeof updateElement>[0]) => {
    setIsLoading(true)
    try {
      const saved = await updateElement(data)
      onDone()
      notifyPositionWarnings(saved.warnings)
    } catch (error) {
      if (isRevisionConflict(error)) setConflict(true)
      else if (!editable) notifyApiError(error)
      else
        form.setErrors(
          error instanceof ApiError
            ? transformErrorsForForm(error.data)
            : { non_field_errors: t("common.unexpectedError") }
        )
    } finally {
      setIsLoading(false)
    }
  }
  const cancel = () => {
    form.reset()
    setArea(element.area_data)
    setConflict(false)
    onDone()
  }
  const errors = form.errors
  const otherErrors = Object.entries(errors).filter(
    ([field]) =>
      !field.startsWith("position.") && !["geometry", "location_source", "location_accuracy_m"].includes(field)
  )
  const atCenter = element.location_source === "area_center"
  const [longitudeValue, latitudeValue] = element.geometry.type === "Point" ? element.geometry.coordinates : []

  return (
    <form
      className="h-100"
      onSubmit={form.onSubmit((values) =>
        save({
          id: element.id,
          revision: element.revision,
          ...positionPayload(values.position),
          ...(area.id !== element.area ? { area: area.id } : {}),
        })
      )}
    >
      <Stack justify="space-between" h="100%">
        <Stack gap="lg" p="xl">
          {conflict && <RevisionConflictAlert onReload={onReload} />}
          <Stack gap="xs">
            <Text fw={600} size="sm">
              {t("inventory.position.current")}
            </Text>
            {element.geometry.type === "Point" ? (
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Value label={t("inventory.fields.latitude")}>{latitudeValue.toFixed(7)}</Value>
                <Value label={t("inventory.fields.longitude")}>{longitudeValue.toFixed(7)}</Value>
                <Value label={t("inventory.fields.accuracy")}>
                  {element.location_accuracy_m
                    ? t("inventory.position.accuracyValue", { value: Number(element.location_accuracy_m) })
                    : "—"}
                </Value>
              </SimpleGrid>
            ) : (
              <GeometrySummary geometry={element.geometry} measures={element} />
            )}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
              <Value label={t("inventory.fields.locationStatus")}>
                <Badge color={element.location_status === "provisional" ? "yellow" : "green"} variant="light">
                  {t(`inventory.locationStatuses.${element.location_status}`)}
                </Badge>
              </Value>
              <Value label={t("inventory.fields.locationSource")}>
                {t(`inventory.locationSources.${element.location_source || "manual"}`)}
              </Value>
            </SimpleGrid>
            {element.location_status === "provisional" && !editable && (
              <Alert color="yellow" p="sm">
                <Stack gap="xs">
                  <Text size="sm">
                    {t(atCenter ? "inventory.position.provisionalAtCenter" : "inventory.position.provisional")}
                  </Text>
                  {!atCenter && !element.removed_on && (
                    <CheckPermission permission={INVENTORY_PERMISSIONS.WRITE_ELEMENTS}>
                      <Group>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<TbMapPinCheck />}
                          loading={isLoading}
                          // Only the status: the position stays.
                          onClick={() =>
                            save({ id: element.id, revision: element.revision, location_status: "verified" })
                          }
                        >
                          {t("inventory.position.confirm")}
                        </Button>
                      </Group>
                    </CheckPermission>
                  )}
                </Stack>
              </Alert>
            )}
          </Stack>
          {editable && (
            <Stack gap="xs">
              <Text fw={600} size="sm">
                {t("inventory.position.newPosition")}
              </Text>
              {otherErrors.length > 0 && (
                <AlertError
                  title={t("common.errorTitle")}
                  message={otherErrors.map(([, message]) => message).join(" ")}
                />
              )}
              <PositionInput
                geometryType={geometryType}
                value={form.values.position}
                onChange={(value) => {
                  form.setFieldValue("position", value)
                  form.clearErrors()
                }}
                errors={{
                  latitude: errors["position.latitude"],
                  longitude: errors["position.longitude"],
                  geometry: errors["position.geometry"] ?? errors.geometry,
                  source: errors.location_source ?? errors.location_accuracy_m,
                }}
              />
              {geometry && (
                <ElementGeometryCheck
                  elementClass={element.element_class}
                  geometry={geometry}
                  client={element.client}
                  area={area.id}
                  element={element.id}
                  onUseArea={chooseArea}
                />
              )}
              {area.id !== element.area && (
                <Text size="sm">{t("inventory.position.areaChanged", { name: areaLabel(area) })}</Text>
              )}
            </Stack>
          )}
        </Stack>
        {editable && (
          <FormFooter>
            <Group justify="space-between" p="sm" className="standard-border-top">
              <Button variant="subtle" color="gray.7" onClick={cancel}>
                {t("common.cancel")}
              </Button>
              <Button leftSection={<TbDeviceFloppy />} type="submit" loading={isLoading}>
                {t("common.save")}
              </Button>
            </Group>
          </FormFooter>
        )}
      </Stack>
    </form>
  )
}
