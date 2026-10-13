import { Button, Group, Stack, Text } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbArrowBackUp, TbCheck, TbPlus, TbTrash, TbX } from "react-icons/tb"
import type { DrawControls } from "./GeometryDraw"

type Props = {
  /** `null` while terra-draw starts. */
  controls: DrawControls | null
}

/**
 * The buttons of the drawing of a line or of a polygon (`GeometryDraw`), with what to do now. Outside the map: under
 * it in a detail, in the panel of the map page. It does not load MapLibre.
 */
export function DrawToolbar({ controls }: Props) {
  const { t } = useTranslation()
  if (!controls) return null
  const { kind, drawing, selected, parts, locked, canUndo } = controls
  const hint = drawing
    ? t(`draw.hints.drawing.${kind}`)
    : selected
      ? t("draw.hints.selected")
      : parts > 0
        ? t("draw.hints.select")
        : null

  return (
    <Stack gap="xs">
      {hint && (
        <Text size="sm" c="dimmed">
          {hint}
        </Text>
      )}
      {locked > 0 && (
        <Text size="sm" c="dimmed">
          {t("draw.locked", { count: locked })}
        </Text>
      )}
      <Group gap="xs">
        {drawing ? (
          <>
            <Button size="xs" leftSection={<TbCheck />} onClick={controls.finishPart}>
              {t("draw.finishPart")}
            </Button>
            {parts + locked > 0 && (
              <Button size="xs" variant="default" leftSection={<TbX />} onClick={controls.cancelPart}>
                {t("draw.cancelPart")}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button size="xs" variant="default" leftSection={<TbPlus />} onClick={controls.addPart}>
              {t("draw.addPart")}
            </Button>
            <Button
              size="xs"
              variant="default"
              color="red"
              leftSection={<TbTrash />}
              disabled={!selected}
              onClick={controls.deletePart}
            >
              {t("draw.deletePart")}
            </Button>
          </>
        )}
        <Button size="xs" variant="subtle" leftSection={<TbArrowBackUp />} disabled={!canUndo} onClick={controls.undo}>
          {t("draw.undo")}
        </Button>
      </Group>
    </Stack>
  )
}
