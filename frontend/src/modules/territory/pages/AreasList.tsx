import { AlertError } from "@/components/AlertError"
import { CheckPermission } from "@/components/CheckPermission"
import { formatSurface } from "@/components/Geometry"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { TableEmptyState, createTable } from "@/components/Table"
import { useUrlParams } from "@/hooks/useUrlParams"
import { ClientSelect } from "@/modules/parties/components/ClientSelect"
import { useClientFilter } from "@/modules/parties/hooks/useClientFilter"
import { translateApiError } from "@/utils"
import { Badge, Box, Button, Chip, Group, Pagination, Text, TextInput } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import dayjs from "dayjs"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { TbPolygon, TbSearch } from "react-icons/tb"
import { Link } from "react-router-dom"
import { useAreas, type AreaFilters } from "../api/areas"
import { useZoneChoices } from "../api/zones"
import { AreaContextActions } from "../components/AreaContextActions"
import { CreateAreaAction } from "../components/CreateAreaAction"
import { ZoneSelect } from "../components/ZoneSelect"
import { zoneLabel } from "../components/zoneModals"
import { TERRITORY_PERMISSIONS } from "../permissions"
import type { AreaListItem } from "../types"

const Table = createTable<AreaListItem>()

function formatDate(value: string) {
  return dayjs(value).format("DD/MM/YYYY")
}

export function AreasList() {
  const { t } = useTranslation()
  const [params, setParams, mergeParams] = useUrlParams()
  // The zone is one of the client: it goes with it.
  const [client, selectClient] = useClientFilter({ dependentParams: ["zone"] })
  const page = Number.parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  const search = params.get("search") || ""
  const zone = params.get("zone") || ""
  const toFix = params.get("has_overlaps") === "true"
  const { data: zoneChoices } = useZoneChoices(client)
  // A zone without the client, or of another one (an edited or old link), would empty the list without showing in its
  // filter: it is dropped from the URL once the zones of the client are known.
  const zoneKnown = !zone || (!!client && (!zoneChoices || zoneChoices.some((choice) => choice.id === zone)))
  useEffect(() => {
    if (zoneKnown) return
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete("zone")
        next.delete("page")
        return next
      },
      { replace: true }
    )
  }, [zoneKnown, setParams])
  const hasFilters = !!search || !!zone || toFix
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const filters = useMemo<AreaFilters>(
    () => ({
      page,
      ordering: ordering || undefined,
      search: debouncedSearch || undefined,
      client: client || undefined,
      zone: (zoneKnown && zone) || undefined,
      has_overlaps: toFix ? "true" : undefined,
    }),
    [page, ordering, debouncedSearch, client, zone, zoneKnown, toFix]
  )
  const { data, isLoading, error } = useAreas(filters)
  const pages = Math.ceil((data?.count ?? 0) / (data?.page_size || 20))
  const createAction = (
    <CheckPermission permission={TERRITORY_PERMISSIONS.WRITE_AREAS}>
      <CreateAreaAction client={client} />
    </CheckPermission>
  )

  return (
    <Page>
      <Header
        icon={<TbPolygon size="1.5rem" />}
        title={t("territory.areas")}
        breadcrumbs={[
          { label: t("territory.title"), href: "/territory" },
          { label: t("territory.areas"), href: "#" },
        ]}
        actions={createAction}
      />
      <Box py="xs" px="sm">
        <Group gap="xs">
          <ClientSelect size="sm" w={260} maw="100%" clearable value={client} onChange={selectClient} />
          {client && (
            <ZoneSelect
              size="sm"
              w={220}
              maw="100%"
              client={client}
              placeholder={t("territory.filters.zone")}
              value={zone || null}
              onChange={(value) => mergeParams({ zone: value ?? "", page: 1 })}
            />
          )}
          <TextInput
            size="sm"
            w={260}
            maw="100%"
            leftSection={<TbSearch />}
            leftSectionPointerEvents="none"
            placeholder={t("territory.areaSearchPlaceholder")}
            aria-label={t("common.searchLabel")}
            value={search}
            onChange={(event) => mergeParams({ search: event.currentTarget.value, page: 1 })}
          />
          <Chip
            size="sm"
            color="yellow"
            checked={toFix}
            onChange={(checked) => mergeParams({ has_overlaps: checked ? "true" : "", page: 1 })}
          >
            {t("territory.filters.toFix")}
          </Chip>
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
      </Box>
      {error && (
        <Box px="sm" pb="xs">
          <AlertError
            title={t("territory.areaLoadError")}
            message={translateApiError(error, t("common.unexpectedError"))}
          />
        </Box>
      )}
      <Table
        data={data?.results ?? []}
        loading={isLoading}
        style={{ flexGrow: 1 }}
        orderBy={ordering.replace("-", "")}
        orderDirection={ordering.startsWith("-") ? "desc" : "asc"}
        onOrderChange={(field, direction) =>
          mergeParams({ ordering: field ? `${direction === "desc" ? "-" : ""}${field}` : "" })
        }
      >
        {data?.full_count === 0 && (
          <Table.Extra.BeforeContent>
            <TableEmptyState
              title={t("territory.areaEmptyTitle")}
              description={t("territory.areaEmptyDescription")}
              action={createAction}
            />
          </Table.Extra.BeforeContent>
        )}
        {!!data?.full_count && data.count === 0 && (
          <Table.Extra.BeforeContent>
            <TableEmptyState title={t("common.noResults")} description={t("territory.areaNoResultsDescription")} />
          </Table.Extra.BeforeContent>
        )}
        <Table.HeaderConfig sticky />
        <Table.Column
          title="territory.fields.code"
          name="number"
          sortable
          width="110px"
          render={(area) => (
            <Link to={`/territory/areas/${area.id}`}>
              <Text fw={500} td="underline">
                {area.code}
              </Text>
            </Link>
          )}
        />
        <Table.Column
          title="fields.name"
          name="name"
          sortable
          render={(area) => (
            <Group gap={6} wrap="wrap">
              <Text size="sm">{area.name}</Text>
              {area.has_overlaps && <Badge color="yellow">{t("territory.toFix")}</Badge>}
              {area.is_fictitious && <Badge color="gray">{t("territory.fictitious")}</Badge>}
            </Group>
          )}
        />
        {/* With a client in the filter, its name would repeat on every row. */}
        {!client && (
          <Table.Column
            title="territory.fields.client"
            name="client"
            mobileHidden
            render={(area) => area.client_data.name}
          />
        )}
        <Table.Column
          title="territory.fields.zone"
          name="zone"
          mobileHidden
          render={(area) => (area.zone_data ? zoneLabel(area.zone_data) : "—")}
        />
        <Table.Column
          title="territory.fields.surface"
          name="surface_m2"
          sortable
          cellAlign="end"
          headerAlign="end"
          render={(area) => formatSurface(area.surface_m2)}
        />
        <Table.Column
          title="territory.fields.urbanGreenType"
          name="urban_green_type"
          mobileHidden
          render={(area) => area.urban_green_type_data.name}
        />
        <Table.Column
          title="territory.columns.management"
          name="management_start"
          sortable
          mobileHidden
          render={(area) =>
            area.management_end
              ? t("territory.managementPeriod", {
                  start: formatDate(area.management_start),
                  end: formatDate(area.management_end),
                })
              : t("territory.managementFrom", { start: formatDate(area.management_start) })
          }
        />
        <Table.Column
          title="fields.actions"
          name="_actions"
          width="80px"
          cellAlign="end"
          headerAlign="end"
          render={(area) => <AreaContextActions area={area} />}
        />
        <Table.Footer.Left>
          <Pagination value={page} onChange={(value) => mergeParams({ page: value })} total={pages} />
        </Table.Footer.Left>
        <Table.Footer.Right>
          <Text size="sm" ta="right">
            {t("territory.areaResults", { shown: data?.results.length ?? 0, total: data?.count ?? 0 })}
          </Text>
        </Table.Footer.Right>
      </Table>
    </Page>
  )
}
