import { DrawToolbar } from "@/components/Map/draw/DrawToolbar"
import type { DrawControls } from "@/components/Map/draw/GeometryDraw"
import type { PointControls } from "@/components/Map/draw/PointPicker"
import { useCurrentPosition } from "@/hooks/useCurrentPosition"
import { ElementClassSelect } from "@/modules/catalogs/components/ElementClassSelect"
import { useCreateElement } from "@/modules/inventory/api/elements"
import { ElementForm } from "@/modules/inventory/components/ElementForm"
import type { PositionValue } from "@/modules/inventory/position"
import type { Element } from "@/modules/inventory/types"
import { useClientChoices } from "@/modules/parties/api/clients"
import { ActionIcon, Box, Button, Group, ScrollArea, Stack, Text, Title } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbArrowLeft, TbArrowRight, TbCrosshair, TbCurrentLocation, TbX } from "react-icons/tb"
import { hasPosition, positionPoint, type CreateElementState, type CreateStep } from "../createElement"

type Props = {
  state: CreateElementState
  onChange: (state: CreateElementState) => void
  /** The client of the filter of the map, which the form proposes if it is active. */
  client: string | null
  drawControls: DrawControls | null
  pointControls: PointControls | null
  onClose: () => void
  onCreated: (element: Element) => void
}

// About a centimeter: the device gives more decimals than it measures.
const COORDINATE_DECIMALS = 7

const STEPS: CreateStep[] = ["class", "position", "form"]

function PointStep({
  position,
  onPosition,
  controls,
}: {
  position: PositionValue | null
  onPosition: (position: PositionValue) => void
  controls: PointControls | null
}) {
  const { t } = useTranslation()
  const { locate, loading, error } = useCurrentPosition()
  const point = positionPoint(position)
  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed">
        {t("map.create.pointHint")}
      </Text>
      <Group gap="xs">
        <Button
          size="sm"
          variant="default"
          leftSection={<TbCurrentLocation />}
          loading={loading}
          onClick={async () => {
            const reading = await locate()
            if (!reading) return
            const latitude = Number(reading.latitude.toFixed(COORDINATE_DECIMALS))
            const longitude = Number(reading.longitude.toFixed(COORDINATE_DECIMALS))
            onPosition({ mode: "coordinates", latitude, longitude, gpsAccuracy: reading.accuracy, geometry: null })
            controls?.show({ type: "Point", coordinates: [longitude, latitude] })
          }}
        >
          {t("geolocation.locate")}
        </Button>
        <Button
          size="sm"
          variant="default"
          leftSection={<TbCrosshair />}
          disabled={!controls}
          onClick={() => controls?.placeAtCrosshair()}
        >
          {t("draw.placeAtCrosshair")}
        </Button>
      </Group>
      {error && (
        <Text size="sm" c="red">
          {t(`geolocation.errors.${error}`)}
        </Text>
      )}
      <Text size="sm">
        {position?.mode === "coordinates" && position.gpsAccuracy !== null
          ? t("inventory.position.gpsReading", { value: Math.round(position.gpsAccuracy) })
          : point
            ? t("inventory.position.mapPoint", {
                latitude: point.coordinates[1].toFixed(COORDINATE_DECIMALS),
                longitude: point.coordinates[0].toFixed(COORDINATE_DECIMALS),
              })
            : t("map.create.noPoint")}
      </Text>
    </Stack>
  )
}

/**
 * The panel of a new element on the map page, in three steps: the class; the position, from the device, under the
 * crosshair or with a tap for a point, drawn with its parts for lines and polygons (the map shows them, this panel
 * has the buttons); the form of the element, with the check of the position and the proposed area.
 */
export function CreateElementPanel({
  state,
  onChange,
  client,
  drawControls,
  pointControls,
  onClose,
  onCreated,
}: Props) {
  const { t } = useTranslation()
  const { mutateAsync: createElement } = useCreateElement()
  const { data: activeClients } = useClientChoices({ active: "true" })
  const defaultClient = activeClients?.some((choice) => choice.id === client) ? client : null
  const { step, elementClass, position } = state
  const kind = elementClass?.geometry_type
  const go = (next: CreateStep) => onChange({ ...state, step: next, formShown: state.formShown || next === "form" })

  const footer = (back: CreateStep | null, next: CreateStep, ready: boolean) => (
    <Group justify="space-between" p="sm" className="standard-border-top">
      {back ? (
        <Button variant="subtle" color="gray.7" leftSection={<TbArrowLeft />} onClick={() => go(back)}>
          {t("map.create.back")}
        </Button>
      ) : (
        <span />
      )}
      <Button rightSection={<TbArrowRight />} disabled={!ready} onClick={() => go(next)}>
        {t("map.create.next")}
      </Button>
    </Group>
  )

  return (
    <Stack gap={0} h="100%">
      <Group justify="space-between" align="flex-start" wrap="nowrap" p="sm" className="standard-border-bottom">
        <Stack gap={0}>
          <Title order={4}>{t("inventory.newElement")}</Title>
          <Text size="xs" c="dimmed">
            {t("map.create.step", { number: STEPS.indexOf(step) + 1, total: STEPS.length })}
            {" · "}
            {t(`map.create.steps.${step}`)}
          </Text>
        </Stack>
        <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label={t("map.create.close")}>
          <TbX />
        </ActionIcon>
      </Group>
      {step === "class" && (
        <>
          {/* Not in a scroll area, which would cut the list of the classes. */}
          <Stack gap="xs" p="sm" flex={1}>
            <ElementClassSelect
              withAsterisk
              label={t("inventory.fields.elementClass")}
              description={t("map.create.classDescription")}
              value={elementClass?.id ?? null}
              // In the drawer, not in a portal: on a phone the list in a portal, placed before its width is known,
              // goes beyond the screen, which then widens (D-058).
              comboboxProps={{ withinPortal: false }}
              onChange={(_, choice) =>
                onChange({
                  ...state,
                  elementClass: choice,
                  // A position of another type of geometry does not serve, nor the form, which keeps the type of its
                  // position. With the same type the form stays, and follows the class.
                  ...(choice?.geometry_type !== kind ? { position: null, formShown: false } : {}),
                })
              }
            />
          </Stack>
          {footer(null, "position", !!elementClass)}
        </>
      )}
      {step === "position" && kind && (
        <>
          <ScrollArea flex={1}>
            <Box p="sm">
              {kind === "point" ? (
                <PointStep
                  position={position}
                  onPosition={(value) => onChange({ ...state, position: value })}
                  controls={pointControls}
                />
              ) : (
                <DrawToolbar controls={drawControls} />
              )}
            </Box>
          </ScrollArea>
          {footer("class", "form", hasPosition(position) && !drawControls?.drawing && !drawControls?.overlap)}
        </>
      )}
      {state.formShown && elementClass && hasPosition(position) && (
        // Hidden while the position changes: the values typed stay.
        <ScrollArea flex={1} display={step === "form" ? undefined : "none"}>
          <Box p="sm">
            <ElementForm
              layout="panel"
              defaultClient={defaultClient}
              defaultClass={elementClass}
              onClassChange={(choice) => onChange({ ...state, elementClass: choice })}
              mapPosition={{ value: position, onEdit: () => go("position") }}
              onSubmit={async (values) => onCreated(await createElement(values))}
            />
          </Box>
        </ScrollArea>
      )}
    </Stack>
  )
}
