import { formatLength, formatSurface } from "@/components/Geometry"
import { WarningsAlert } from "@/components/WarningsAlert"
import { useElement } from "@/modules/inventory/api/elements"
import { elementLabel } from "@/modules/inventory/labels"
import { useArea } from "@/modules/territory/api/areas"
import { areaLabel } from "@/modules/territory/components/areaModals"
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Center,
  Drawer,
  Group,
  Loader,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import dayjs from "dayjs"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { TbExternalLink, TbFocusCentered, TbX } from "react-icons/tb"
import { Link } from "react-router-dom"
import type { Selection } from "../hooks/useMapUrlState"
import { DRAWER_SHARE } from "./MapContent"
import classes from "./FeaturePanel.module.css"

type Props = {
  selection: Selection | null
  /** On a phone a drawer from the bottom, over the map; otherwise a column on the right, next to the map. */
  mobile: boolean
  onClose: () => void
  onFit: () => void
}

type ContentProps = { id: string; onClose: () => void; onFit: () => void }

function Value({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={0}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500} component="div">
        {children || "—"}
      </Text>
    </Stack>
  )
}

function date(value: string | null) {
  return value ? dayjs(value).format("DD/MM/YYYY") : null
}

/** Title, badges, values and actions of a feature, or its loading and its error. */
function Frame({
  title,
  badges,
  detailPath,
  loading,
  error,
  onClose,
  onFit,
  children,
}: {
  title: string | null
  badges?: ReactNode
  detailPath: string
  loading: boolean
  error: boolean
  onClose: () => void
  onFit: () => void
  children?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Stack gap={0} h="100%">
      <Group justify="space-between" align="flex-start" wrap="nowrap" p="sm" className="standard-border-bottom">
        <Stack gap={4}>
          <Title order={4}>{title ?? t(error ? "map.panel.notAvailable" : "map.panel.loading")}</Title>
          {badges && <Group gap="xs">{badges}</Group>}
        </Stack>
        <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label={t("map.panel.close")}>
          <TbX />
        </ActionIcon>
      </Group>
      <ScrollArea flex={1}>
        {loading && (
          <Center p="xl">
            <Loader />
          </Center>
        )}
        {error && (
          <Alert m="sm" color="red">
            {t("map.panel.loadError")}
          </Alert>
        )}
        {children && (
          <Stack gap="sm" p="sm">
            {children}
          </Stack>
        )}
      </ScrollArea>
      {!loading && !error && (
        <Group gap="xs" p="sm" className="standard-border-top">
          <Button component={Link} to={detailPath} size="xs" leftSection={<TbExternalLink />}>
            {t("map.panel.open")}
          </Button>
          <Button size="xs" variant="default" leftSection={<TbFocusCentered />} onClick={onFit}>
            {t("map.panel.fit")}
          </Button>
        </Group>
      )}
    </Stack>
  )
}

function AreaContent({ id, onClose, onFit }: ContentProps) {
  const { t } = useTranslation()
  const { data, isError } = useArea(id)
  const area = data?.id === id ? data : undefined
  return (
    <Frame
      title={area ? areaLabel(area) : null}
      badges={area?.is_fictitious && <Badge color="gray">{t("territory.fictitious")}</Badge>}
      detailPath={`/territory/areas/${id}`}
      loading={!area && !isError}
      error={isError}
      onClose={onClose}
      onFit={onFit}
    >
      {area && (
        <>
          <WarningsAlert warnings={area.warnings} />
          <SimpleGrid cols={2} spacing="sm">
            <Value label={t("territory.fields.client")}>{area.client_data.name}</Value>
            <Value label={t("territory.fields.zone")}>
              {area.zone_data && `${area.zone_data.code} ${area.zone_data.name}`}
            </Value>
            <Value label={t("territory.fields.surface")}>{formatSurface(area.surface_m2)}</Value>
            <Value label={t("territory.fields.urbanGreenType")}>{area.urban_green_type_data.name}</Value>
            <Value label={t("territory.fields.areaUse")}>{area.area_use_data.name}</Value>
            <Value label={t("territory.fields.usageIntensity")}>{area.usage_intensity_data.name}</Value>
            <Value label={t("territory.fields.managementStart")}>{date(area.management_start)}</Value>
            <Value label={t("territory.fields.managementEnd")}>{date(area.management_end)}</Value>
          </SimpleGrid>
        </>
      )}
    </Frame>
  )
}

function ElementContent({ id, onClose, onFit }: ContentProps) {
  const { t } = useTranslation()
  const { data, isError } = useElement(id)
  const element = data?.id === id ? data : undefined
  const species = element?.species_data
    ? element.species_data.scientific_name
    : element?.composition.map((item) => item.species_data.scientific_name).join(", ")
  return (
    <Frame
      title={element ? elementLabel(element) : null}
      badges={
        element && (
          <>
            {element.removed_on && <Badge color="gray">{t("inventory.removed")}</Badge>}
            {element.location_status === "provisional" && <Badge color="yellow">{t("inventory.provisional")}</Badge>}
          </>
        )
      }
      detailPath={`/inventory/elements/${id}`}
      loading={!element && !isError}
      error={isError}
      onClose={onClose}
      onFit={onFit}
    >
      {element && (
        <>
          <WarningsAlert warnings={element.warnings} />
          <SimpleGrid cols={2} spacing="sm">
            <Value label={t("inventory.fields.elementClass")}>{element.element_class_data.name}</Value>
            <Value
              label={t(element.composition.length > 0 ? "inventory.fields.composition" : "inventory.fields.species")}
            >
              {species}
            </Value>
            <Value label={t("inventory.fields.area")}>{areaLabel(element.area_data)}</Value>
            <Value label={t("inventory.fields.client")}>{element.client_data.name}</Value>
            <Value label={t("inventory.fields.tagNumber")}>{element.tag_number}</Value>
            <Value label={t("inventory.fields.plantedOn")}>{date(element.planted_on)}</Value>
            {element.surface_m2 && (
              <Value label={t("territory.fields.surface")}>{formatSurface(element.surface_m2)}</Value>
            )}
            {element.length_m && <Value label={t("map.panel.length")}>{formatLength(element.length_m)}</Value>}
          </SimpleGrid>
        </>
      )}
    </Frame>
  )
}

/** The feature selected on the map, with its main data and the link to its detail. */
export function FeaturePanel({ selection, mobile, onClose, onFit }: Props) {
  const { t } = useTranslation()
  const content =
    selection &&
    (selection.kind === "area" ? (
      <AreaContent key={selection.id} id={selection.id} onClose={onClose} onFit={onFit} />
    ) : (
      <ElementContent key={selection.id} id={selection.id} onClose={onClose} onFit={onFit} />
    ))

  if (mobile) {
    // Without the overlay: the map stays usable above the drawer.
    return (
      <Drawer
        opened={!!selection}
        onClose={onClose}
        position="bottom"
        size={`${DRAWER_SHARE * 100}%`}
        withOverlay={false}
        withCloseButton={false}
        lockScroll={false}
        trapFocus={false}
        closeOnClickOutside={false}
        aria-label={t("map.panel.label")}
        styles={{
          body: { padding: 0, height: "100%" },
          content: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
        }}
      >
        {content}
      </Drawer>
    )
  }
  if (!selection) return null
  return (
    <aside className={classes.side} aria-label={t("map.panel.label")}>
      {content}
    </aside>
  )
}
