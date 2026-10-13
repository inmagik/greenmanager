import { GeometryFileInput } from "@/components/Geometry"
import { GeometryEditor } from "@/components/Map"
import { useCurrentPosition } from "@/hooks/useCurrentPosition"
import type { GeometryType } from "@/modules/catalogs/types"
import { Button, Group, NumberInput, SegmentedControl, Stack, Text } from "@mantine/core"
import type { Geometry } from "geojson"
import { useTranslation } from "react-i18next"
import { TbCurrentLocation } from "react-icons/tb"
import type { PositionMode, PositionValue } from "../position"

type Props = {
  geometryType: GeometryType
  value: PositionValue
  onChange: (value: PositionValue) => void
  /** The geometry whose parts the map edits, e.g. the saved line of the element; none for a new position. */
  mapInitial?: Geometry | null
  /** Geometries shown under the one drawn, and framed: the saved position, the area of a new element. */
  mapContext?: Geometry[]
  /** A part being drawn on the map has vertices (`GeometryEditor`): the form does not save meanwhile. */
  onDrawing?: (drawing: boolean) => void
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

const MODES: Record<"point" | "other", PositionMode[]> = {
  point: ["coordinates", "map", "area_center"],
  other: ["map", "file"],
}

/**
 * The position of an element: for a point, coordinates typed or read from the device ("Use my position", with the
 * accuracy it declares), a point on the map, or the center of the area; for lines and polygons, the parts drawn on
 * the map (`GeometryEditor`) or a GeoJSON file.
 */
export function PositionInput({
  geometryType,
  value,
  onChange,
  mapInitial = null,
  mapContext,
  onDrawing,
  errors,
}: Props) {
  const { t } = useTranslation()
  const { locate, loading, error: positionError } = useCurrentPosition()

  // A typed coordinate is not the one of the device any more.
  const setCoordinate = (field: "latitude" | "longitude", coordinate: number | string) =>
    onChange({ ...value, [field]: coordinate, gpsAccuracy: null })

  return (
    <Stack gap="xs">
      <SegmentedControl
        aria-label={t("inventory.position.modeLabel")}
        data={MODES[geometryType === "point" ? "point" : "other"].map((mode) => ({
          value: mode,
          label: t(`inventory.position.modes.${mode}`),
        }))}
        value={value.mode}
        // The geometry of the map or of the file is not the one of the other mode.
        onChange={(mode) => onChange({ ...value, mode: mode as PositionMode, geometry: null })}
        style={{ alignSelf: "flex-start" }}
      />
      {value.mode === "area_center" && (
        <Text size="sm" c="dimmed">
          {t("inventory.position.areaCenterDescription")}
        </Text>
      )}
      {value.mode === "map" && (
        <GeometryEditor
          kind={geometryType}
          initial={geometryType === "point" ? null : mapInitial}
          context={mapContext}
          label={t("inventory.position.editorLabel")}
          onChange={(geometry) => onChange({ ...value, mode: "map", geometry })}
          onDrawing={onDrawing}
        />
      )}
      {value.mode === "file" && (
        <GeometryFileInput
          kind={geometryType}
          withAsterisk
          label={t(`inventory.position.fileLabel.${geometryType}`)}
          description={t("inventory.position.fileDescription")}
          onChange={(geometry) => onChange({ ...value, mode: "file", geometry: geometry as PositionValue["geometry"] })}
          error={errors.geometry}
        />
      )}
      {value.mode === "coordinates" && (
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
