import { AlertError } from "@/components/AlertError"
import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { TableEmptyState } from "@/components/Table"
import { useUrlParams } from "@/hooks/useUrlParams"
import { ElementClassSelect } from "@/modules/catalogs/components/ElementClassSelect"
import { SpeciesSelect } from "@/modules/catalogs/components/SpeciesSelect"
import { enumLabel } from "@/modules/catalogs/fields"
import { ELEMENT_CATEGORIES, type ElementCategory } from "@/modules/catalogs/types"
import { ClientSelect } from "@/modules/parties/components/ClientSelect"
import { useClientFilter } from "@/modules/parties/hooks/useClientFilter"
import { useAreaChoices } from "@/modules/territory/api/areas"
import { useZoneChoices } from "@/modules/territory/api/zones"
import { AreaSelect } from "@/modules/territory/components/AreaSelect"
import { ZoneSelect } from "@/modules/territory/components/ZoneSelect"
import { translateApiError } from "@/utils"
import { Box, Button, Chip, Collapse, Group, Select, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useDebouncedValue } from "@mantine/hooks"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbFilter, TbListTree, TbSearch } from "react-icons/tb"
import type { SetURLSearchParams } from "react-router-dom"
import { useElements, type ElementFilters } from "../api/elements"
import { CreateElementAction } from "../components/CreateElementAction"
import { ElementsTable } from "../components/ElementsTable"
import { INVENTORY_PERMISSIONS } from "../permissions"
import { LOCATION_STATUSES, type LocationStatus } from "../types"

const PRESENCES = ["present", "removed", "all", "on"] as const
type Presence = (typeof PRESENCES)[number]

// Filters in the panel opened by the "Filters" button; the others are always shown.
const PANEL_FILTERS = ["zone", "area", "category", "element_class", "species", "location_status"]

/**
 * A filter that depends on the client (zone, area), known once the choices of the client are: without the client, or
 * of another one (an edited or old link), it would empty the list without showing in its select, so it is dropped
 * from the URL.
 */
function useKnownParam(
  name: string,
  value: string,
  client: string | null,
  choices: { id: string }[] | undefined,
  setParams: SetURLSearchParams
) {
  const known = !value || (!!client && (!choices || choices.some((choice) => choice.id === value)))
  useEffect(() => {
    if (known) return
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(name)
        next.delete("page")
        return next
      },
      { replace: true }
    )
  }, [known, name, setParams])
  return known
}

export function ElementsList() {
  const { t } = useTranslation()
  const [params, setParams, mergeParams] = useUrlParams()
  // Zone and area are of the client: they go with it.
  const [client, selectClient] = useClientFilter({ dependentParams: ["zone", "area"] })
  const page = Number.parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  const search = params.get("search") || ""
  const zone = params.get("zone") || ""
  const area = params.get("area") || ""
  const category = params.get("category") || ""
  const elementClass = params.get("element_class") || ""
  const species = params.get("species") || ""
  const locationStatus = params.get("location_status") || ""
  const presence: Presence = PRESENCES.includes(params.get("presence") as Presence)
    ? (params.get("presence") as Presence)
    : "present"
  const presentOn = params.get("present_on") || ""
  const outsideArea = params.get("outside_area") === "true"
  const { data: zoneChoices } = useZoneChoices(client)
  const zoneKnown = useKnownParam("zone", zone, client, zoneChoices, setParams)
  const { data: areaChoices } = useAreaChoices(client, zoneKnown ? zone : null)
  const areaKnown = useKnownParam("area", area, client, areaChoices, setParams)
  const panelCount = PANEL_FILTERS.filter((name) => !!params.get(name)).length
  const [panelOpen, setPanelOpen] = useState(panelCount > 0)
  const hasFilters = !!search || panelCount > 0 || presence !== "present" || outsideArea
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const filters = useMemo<ElementFilters>(
    () => ({
      page,
      ordering: ordering || undefined,
      search: debouncedSearch || undefined,
      client: client || undefined,
      zone: (zoneKnown && zone) || undefined,
      area: (areaKnown && area) || undefined,
      category: (category as ElementCategory) || undefined,
      element_class: elementClass || undefined,
      species: species || undefined,
      location_status: (locationStatus as LocationStatus) || undefined,
      removed: presence === "present" ? "false" : presence === "removed" ? "true" : undefined,
      present_on: (presence === "on" && presentOn) || undefined,
      outside_area: outsideArea ? "true" : undefined,
    }),
    [
      page,
      ordering,
      debouncedSearch,
      client,
      zone,
      zoneKnown,
      area,
      areaKnown,
      category,
      elementClass,
      species,
      locationStatus,
      presence,
      presentOn,
      outsideArea,
    ]
  )
  const { data, isLoading, error } = useElements(filters)
  const createAction = (
    <CheckPermission permission={INVENTORY_PERMISSIONS.WRITE_ELEMENTS}>
      <CreateElementAction client={client} area={areaKnown ? area || null : null} />
    </CheckPermission>
  )

  return (
    <Page>
      <Header
        icon={<TbListTree size="1.5rem" />}
        title={t("inventory.elements")}
        breadcrumbs={[
          { label: t("inventory.title"), href: "/inventory" },
          { label: t("inventory.elements"), href: "#" },
        ]}
        actions={createAction}
      />
      <Box py="xs" px="sm">
        <Group gap="xs">
          <ClientSelect size="sm" w={260} maw="100%" clearable value={client} onChange={selectClient} />
          <TextInput
            size="sm"
            w={260}
            maw="100%"
            leftSection={<TbSearch />}
            leftSectionPointerEvents="none"
            placeholder={t("inventory.searchPlaceholder")}
            aria-label={t("common.searchLabel")}
            value={search}
            onChange={(event) => mergeParams({ search: event.currentTarget.value, page: 1 })}
          />
          <Select
            size="sm"
            w={200}
            maw="100%"
            aria-label={t("inventory.filters.presence")}
            allowDeselect={false}
            data={PRESENCES.map((value) => ({ value, label: t(`inventory.presence.${value}`) }))}
            value={presence}
            onChange={(value) =>
              mergeParams({ presence: value === "present" ? "" : (value ?? ""), present_on: "", page: 1 })
            }
          />
          {presence === "on" && (
            <DateInput
              size="sm"
              w={160}
              aria-label={t("inventory.filters.presentOn")}
              placeholder={t("inventory.filters.presentOn")}
              valueFormat="DD/MM/YYYY"
              clearable
              value={presentOn || null}
              onChange={(value) => mergeParams({ present_on: value ?? "", page: 1 })}
            />
          )}
          <Chip
            size="sm"
            color="yellow"
            checked={outsideArea}
            onChange={(checked) => mergeParams({ outside_area: checked ? "true" : "", page: 1 })}
          >
            {t("inventory.filters.outsideArea")}
          </Chip>
          <Button
            variant={panelOpen ? "light" : "default"}
            size="xs"
            leftSection={<TbFilter />}
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((open) => !open)}
          >
            {panelCount ? t("inventory.filters.moreCount", { count: panelCount }) : t("inventory.filters.more")}
          </Button>
          {hasFilters && (
            <Button
              variant="subtle"
              size="xs"
              color="gray"
              // The client stays: it has its own filter, remembered for the other lists.
              onClick={() => setParams({ page: "1", ...(ordering && { ordering }), ...(client && { client }) })}
            >
              {t("common.reset")}
            </Button>
          )}
        </Group>
        <Collapse expanded={panelOpen}>
          <Group gap="xs" pt="xs">
            {client && (
              <>
                <ZoneSelect
                  size="sm"
                  w={220}
                  maw="100%"
                  client={client}
                  placeholder={t("inventory.filters.zone")}
                  value={zone || null}
                  // The areas are those of the zone.
                  onChange={(value) => mergeParams({ zone: value ?? "", area: "", page: 1 })}
                />
                <AreaSelect
                  size="sm"
                  w={240}
                  maw="100%"
                  client={client}
                  zone={zoneKnown ? zone : null}
                  placeholder={t("inventory.filters.area")}
                  value={area || null}
                  onChange={(value) => mergeParams({ area: value ?? "", page: 1 })}
                />
              </>
            )}
            <Select
              size="sm"
              w={180}
              maw="100%"
              clearable
              placeholder={t("inventory.filters.category")}
              aria-label={t("inventory.filters.category")}
              data={ELEMENT_CATEGORIES.map((value) => ({ value, label: enumLabel(t, "category", value) }))}
              value={category || null}
              onChange={(value) => mergeParams({ category: value ?? "", page: 1 })}
            />
            <ElementClassSelect
              size="sm"
              w={240}
              maw="100%"
              clearable
              placeholder={t("inventory.filters.elementClass")}
              filters={category ? { category } : undefined}
              value={elementClass || null}
              onChange={(value) => mergeParams({ element_class: value ?? "", page: 1 })}
            />
            <Box w={280} maw="100%">
              <SpeciesSelect
                placeholder={t("inventory.filters.species")}
                value={species || null}
                onChange={(value) => mergeParams({ species: value ?? "", page: 1 })}
              />
            </Box>
            <Select
              size="sm"
              w={180}
              maw="100%"
              clearable
              placeholder={t("inventory.filters.locationStatus")}
              aria-label={t("inventory.filters.locationStatus")}
              data={LOCATION_STATUSES.map((value) => ({ value, label: t(`inventory.locationStatuses.${value}`) }))}
              value={locationStatus || null}
              onChange={(value) => mergeParams({ location_status: value ?? "", page: 1 })}
            />
          </Group>
        </Collapse>
      </Box>
      {error && (
        <Box px="sm" pb="xs">
          <AlertError
            title={t("inventory.loadError")}
            message={translateApiError(error, t("common.unexpectedError"))}
          />
        </Box>
      )}
      <ElementsTable
        data={data}
        loading={isLoading}
        page={page}
        onPageChange={(value) => mergeParams({ page: value })}
        ordering={ordering}
        onOrderingChange={(value) => mergeParams({ ordering: value })}
        // With a client or an area in the filter, its name would repeat on every row.
        showClient={!client}
        showArea={!(areaKnown && area)}
        showRemoval={presence !== "present"}
        emptyState={
          <TableEmptyState
            title={t("inventory.emptyTitle")}
            description={t("inventory.emptyDescription")}
            action={createAction}
          />
        }
        noResults={<TableEmptyState title={t("common.noResults")} description={t("inventory.noResultsDescription")} />}
      />
    </Page>
  )
}
