import { AlertError } from "@/components/AlertError"
import { GeometrySummary } from "@/components/Geometry"
import { WarningsAlert } from "@/components/WarningsAlert"
import { areaLabel } from "@/modules/territory/components/areaModals"
import { apiErrorMessage } from "@/utils"
import { Button, Group, Stack, Text } from "@mantine/core"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useElementGeometryCheck } from "../api/elements"
import type { ElementGeometryCheckResult, ElementGeometryInput } from "../types"

type SuggestedArea = NonNullable<ElementGeometryCheckResult["suggested_area"]>

type Props = {
  elementClass: string
  geometry: ElementGeometryInput
  /** The client whose areas to propose; a changed element gives its own. */
  client: string | null
  /** The area chosen in the form, which the warnings are about. */
  area: string | null
  /** The element being changed: it stays out of the near trees. */
  element?: string
  /** Choose the proposed area. */
  onUseArea: (area: SuggestedArea) => void
  /** Choose the proposed area by itself while the form has none (a new element). */
  autoFill?: boolean
}

/**
 * A position not saved yet: its measures, the proposed area and the warnings from `geometry-check/` (D-052). The
 * area stays a choice of the surveyor: the proposal fills it only when it is empty.
 */
export function ElementGeometryCheck({ elementClass, geometry, client, area, element, onUseArea, autoFill }: Props) {
  const { t } = useTranslation()
  const check = useMemo(
    () => (client || element ? { element_class: elementClass, geometry, client, area, element } : null),
    [elementClass, geometry, client, area, element]
  )
  const { data, error, isFetching, isPlaceholderData } = useElementGeometryCheck(check)
  const suggested = check ? data?.suggested_area : undefined

  useEffect(() => {
    // Not with the result of the position before, still shown while the new one arrives.
    if (autoFill && !area && suggested && !isPlaceholderData) onUseArea(suggested)
  }, [autoFill, area, suggested, isPlaceholderData, onUseArea])

  if (!check) {
    return (
      <Text size="sm" c="dimmed">
        {t("inventory.geometryCheck.chooseClient")}
      </Text>
    )
  }
  return (
    <Stack gap="sm">
      {geometry.type !== "Point" && <GeometrySummary geometry={geometry} measures={data} loading={isFetching} />}
      {error && <AlertError title={t("inventory.geometryCheck.error")} message={apiErrorMessage(error)} />}
      {data &&
        (suggested ? (
          suggested.id !== area && (
            <Group gap="xs">
              <Text size="sm">{t("inventory.geometryCheck.suggestedArea", { name: areaLabel(suggested) })}</Text>
              <Button size="compact-sm" variant="light" onClick={() => onUseArea(suggested)}>
                {t("inventory.geometryCheck.useSuggestedArea")}
              </Button>
            </Group>
          )
        ) : (
          <Text size="sm" c="dimmed">
            {t("inventory.geometryCheck.noSuggestedArea")}
          </Text>
        ))}
      {data && <WarningsAlert warnings={data.warnings} />}
    </Stack>
  )
}
