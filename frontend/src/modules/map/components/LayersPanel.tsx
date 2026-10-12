import { enumLabel } from "@/modules/catalogs/fields"
import { ELEMENT_CATEGORIES } from "@/modules/catalogs/types"
import { ClientSelect } from "@/modules/parties/components/ClientSelect"
import { ActionIcon, Box, Checkbox, Collapse, Divider, Group, Loader, Paper, Stack, Text } from "@mantine/core"
import { useDisclosure, useMediaQuery } from "@mantine/hooks"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { TbChevronDown, TbChevronUp, TbStack2 } from "react-icons/tb"
import type { MapLayer } from "../hooks/useMapUrlState"
import { CATEGORY_COLORS } from "../layers"
import classes from "./LayersPanel.module.css"

/**
 * The state of a layer: hidden by the user, below its zoom, loading, loaded, loaded only in part (in the box, or
 * of the client, which zooming in does not help), failed.
 */
export type LayerStatus = "hidden" | "zoomIn" | "loading" | "ready" | "truncated" | "tooMany" | "error"

type Props = {
  client: string | null
  onClientChange: (client: string | null) => void
  layers: MapLayer[]
  onLayersChange: (layers: MapLayer[]) => void
  /** `null` for a layer the user does not read. */
  areas: LayerStatus | null
  elements: LayerStatus | null
  basemapSwitcher: ReactNode
}

function Dot({ color, provisional = false }: { color: string; provisional?: boolean }) {
  return <span className={classes.dot} style={{ background: color }} data-provisional={provisional || undefined} />
}

// The messages of a layer under its checkbox; the loading is a loader next to it.
function StatusNote({ layer, status }: { layer: MapLayer; status: LayerStatus }) {
  const { t } = useTranslation()
  if (status === "zoomIn" || status === "truncated" || status === "tooMany" || status === "error") {
    return (
      <Text size="xs" c={status === "error" ? "red" : "dimmed"} pl="lg">
        {t(`map.status.${status}.${layer}`)}
      </Text>
    )
  }
  return null
}

/**
 * The panel over the map, on the left: the client of the filter, the layers with their state and the legend of the
 * elements, the basemap. On a phone it starts closed.
 */
export function LayersPanel({
  client,
  onClientChange,
  layers,
  onLayersChange,
  areas,
  elements,
  basemapSwitcher,
}: Props) {
  const { t } = useTranslation()
  const mobile = useMediaQuery("(max-width: 47.99em)", false, { getInitialValueInEffect: false })
  const [opened, { toggle }] = useDisclosure(!mobile)
  const statuses: [MapLayer, LayerStatus | null][] = [
    ["areas", areas],
    ["elements", elements],
  ]

  return (
    <Paper className={classes.panel} shadow="sm" radius="sm" withBorder>
      <Group justify="space-between" wrap="nowrap" px="sm" py="xs" gap="xs">
        <Group gap="xs" wrap="nowrap">
          <TbStack2 />
          <Text size="sm" fw={600}>
            {t("map.layers.title")}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={toggle}
          aria-expanded={opened}
          aria-label={t(opened ? "map.layers.hide" : "map.layers.show")}
        >
          {opened ? <TbChevronUp /> : <TbChevronDown />}
        </ActionIcon>
      </Group>
      {/* Hidden with CSS: the basemap switcher keeps applying the basemap of the URL. */}
      <Collapse expanded={opened} keepMountedMode="display-none">
        <Box className={classes.body}>
          <Stack gap="sm" px="sm" pb="sm">
            <ClientSelect size="xs" clearable value={client} onChange={onClientChange} />
            {statuses.map(
              ([layer, status]) =>
                status && (
                  <Stack key={layer} gap={4}>
                    <Group gap="xs" wrap="nowrap">
                      <Checkbox
                        size="xs"
                        label={t(`map.layers.${layer}`)}
                        checked={layers.includes(layer)}
                        onChange={(event) =>
                          onLayersChange(
                            event.currentTarget.checked
                              ? [...layers, layer]
                              : layers.filter((visible) => visible !== layer)
                          )
                        }
                      />
                      {status === "loading" && <Loader size="xs" />}
                    </Group>
                    <StatusNote layer={layer} status={status} />
                    {layer === "elements" && status !== "hidden" && (
                      <Stack gap={2} pl="lg">
                        {ELEMENT_CATEGORIES.map((category) => (
                          <Group key={category} gap={6} wrap="nowrap">
                            <Dot color={CATEGORY_COLORS[category]} />
                            <Text size="xs">{enumLabel(t, "category", category)}</Text>
                          </Group>
                        ))}
                        <Group gap={6} wrap="nowrap">
                          <Dot color={CATEGORY_COLORS.vegetation} provisional />
                          <Text size="xs">{t("map.legend.provisional")}</Text>
                        </Group>
                      </Stack>
                    )}
                  </Stack>
                )
            )}
            <Divider />
            {basemapSwitcher}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  )
}
