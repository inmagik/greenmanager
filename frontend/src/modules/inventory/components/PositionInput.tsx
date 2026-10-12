import { GeometryFileInput } from "@/components/Geometry"
import { useCurrentPosition } from "@/hooks/useCurrentPosition"
import type { GeometryType } from "@/modules/catalogs/types"
import { Button, Group, NumberInput, SegmentedControl, Stack, Text } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbCurrentLocation } from "react-icons/tb"
import type { PositionValue } from "../position"

type Props = {
  geometryType: GeometryType
  value: PositionValue
  onChange: (value: PositionValue) => void
  /** Errors of the form (`latitude`, `longitude`, `geometry`) and of the server (`geometry`, `location_source`). */
  errors: {
    latitude?: React.ReactNode
    longitude?: React.ReactNode
    geometry?: React.ReactNode
    source?: React.ReactNode
  }
}

// About a centimeter: the device gives more decimals than it measures.
const COORDINATE_DECIMALS = 7

/**
 * The position of an element without the map: the coordinates of a point, typed or read from the device ("Use my
 * position", with the accuracy it declares), or the center of the area; a line or a polygon from a GeoJSON file.
 */
export function PositionInput({ geometryType, value, onChange, errors }: Props) {
  const { t } = useTranslation()
  const { locate, loading, error: positionError } = useCurrentPosition()

  if (geometryType !== "point") {
    return (
      <GeometryFileInput
        kind={geometryType}
        withAsterisk
        label={t(`inventory.position.fileLabel.${geometryType}`)}
        description={t("inventory.position.fileDescription")}
        onChange={(geometry) => onChange({ ...value, mode: "file", geometry: geometry as PositionValue["geometry"] })}
        error={errors.geometry}
      />
    )
  }

  // A typed coordinate is not the one of the device any more.
  const setCoordinate = (field: "latitude" | "longitude", coordinate: number | string) =>
    onChange({ ...value, [field]: coordinate, gpsAccuracy: null })

  return (
    <Stack gap="xs">
      <SegmentedControl
        aria-label={t("inventory.position.modeLabel")}
        data={(["coordinates", "area_center"] as const).map((mode) => ({
          value: mode,
          label: t(`inventory.position.modes.${mode}`),
        }))}
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode: mode as PositionValue["mode"] })}
        style={{ alignSelf: "flex-start" }}
      />
      {value.mode === "area_center" ? (
        <Text size="sm" c="dimmed">
          {t("inventory.position.areaCenterDescription")}
        </Text>
      ) : (
        <>
          <Group gap="sm" align="flex-start" wrap="wrap">
            <NumberInput
              withAsterisk
              label={t("inventory.fields.latitude")}
              w={170}
              decimalScale={COORDINATE_DECIMALS}
              min={-90}
              max={90}
              hideControls
              inputMode="decimal"
              value={value.latitude}
              onChange={(coordinate) => setCoordinate("latitude", coordinate)}
              error={errors.latitude}
            />
            <NumberInput
              withAsterisk
              label={t("inventory.fields.longitude")}
              w={170}
              decimalScale={COORDINATE_DECIMALS}
              min={-180}
              max={180}
              hideControls
              inputMode="decimal"
              value={value.longitude}
              onChange={(coordinate) => setCoordinate("longitude", coordinate)}
              error={errors.longitude}
            />
            <Button
              variant="default"
              mt={{ base: 0, xs: 25 }}
              leftSection={<TbCurrentLocation />}
              loading={loading}
              onClick={async () => {
                const position = await locate()
                if (!position) return
                onChange({
                  ...value,
                  latitude: Number(position.latitude.toFixed(COORDINATE_DECIMALS)),
                  longitude: Number(position.longitude.toFixed(COORDINATE_DECIMALS)),
                  gpsAccuracy: position.accuracy,
                })
              }}
            >
              {t("geolocation.locate")}
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            {value.gpsAccuracy !== null
              ? t("inventory.position.gpsReading", { value: Math.round(value.gpsAccuracy) })
              : t("inventory.position.coordinatesDescription")}
          </Text>
          {positionError && (
            <Text size="sm" c="red">
              {t(`geolocation.errors.${positionError}`)}
            </Text>
          )}
        </>
      )}
      {errors.geometry && value.mode !== "file" && (
        <Text size="sm" c="red">
          {errors.geometry}
        </Text>
      )}
      {errors.source && (
        <Text size="sm" c="red">
          {errors.source}
        </Text>
      )}
    </Stack>
  )
}
