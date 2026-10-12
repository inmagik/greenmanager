import { AlertError } from "@/components/AlertError"
import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { TableEmptyState, createTable } from "@/components/Table"
import { useUrlParams } from "@/hooks/useUrlParams"
import { ClientSelect } from "@/modules/parties/components/ClientSelect"
import { useClientFilter } from "@/modules/parties/hooks/useClientFilter"
import { translateApiError } from "@/utils"
import { Box, Button, Group, Pagination, Text, TextInput } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { TbSearch, TbStack2 } from "react-icons/tb"
import { Link } from "react-router-dom"
import { useZones, type ZoneFilters } from "../api/zones"
import { CreateZoneAction } from "../components/CreateZoneAction"
import { ZoneContextActions } from "../components/ZoneContextActions"
import { TERRITORY_PERMISSIONS } from "../permissions"
import type { Zone } from "../types"

const Table = createTable<Zone>()

export function ZonesList() {
  const { t } = useTranslation()
  const [params, setParams, mergeParams] = useUrlParams()
  const [client, selectClient] = useClientFilter()
  const page = Number.parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  const search = params.get("search") || ""
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const filters = useMemo<ZoneFilters>(
    () => ({
      page,
      ordering: ordering || undefined,
      search: debouncedSearch || undefined,
      client: client || undefined,
    }),
    [page, ordering, debouncedSearch, client]
  )
  const { data, isLoading, error } = useZones(filters)
  const pages = Math.ceil((data?.count ?? 0) / (data?.page_size || 20))
  const createAction = (
    <CheckPermission permission={TERRITORY_PERMISSIONS.WRITE_AREAS}>
      <CreateZoneAction client={client} />
    </CheckPermission>
  )

  return (
    <Page>
      <Header
        icon={<TbStack2 size="1.5rem" />}
        title={t("territory.zones")}
        breadcrumbs={[
          { label: t("territory.title"), href: "/territory" },
          { label: t("territory.zones"), href: "#" },
        ]}
        actions={createAction}
      />
      <Box py="xs" px="sm">
        <Group gap="xs">
          <ClientSelect size="sm" w={260} maw="100%" clearable value={client} onChange={selectClient} />
          <TextInput
            size="sm"
            w={300}
            maw="100%"
            leftSection={<TbSearch />}
            leftSectionPointerEvents="none"
            placeholder={t("territory.zoneSearchPlaceholder")}
            aria-label={t("common.searchLabel")}
            value={search}
            onChange={(event) => mergeParams({ search: event.currentTarget.value, page: 1 })}
          />
          {!!search && (
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
            title={t("territory.zoneLoadError")}
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
              title={t("territory.zoneEmptyTitle")}
              description={t("territory.zoneEmptyDescription")}
              action={createAction}
            />
          </Table.Extra.BeforeContent>
        )}
        {!!data?.full_count && data.count === 0 && (
          <Table.Extra.BeforeContent>
            <TableEmptyState title={t("common.noResults")} description={t("territory.zoneNoResultsDescription")} />
          </Table.Extra.BeforeContent>
        )}
        <Table.HeaderConfig sticky />
        <Table.Column
          title="territory.fields.zoneCode"
          name="code"
          sortable
          width="100px"
          render={(zone) => zone.code}
        />
        <Table.Column
          title="fields.name"
          name="name"
          sortable
          render={(zone) => (
            <Link to={`/territory/zones/${zone.id}`}>
              <Text fw={500} td="underline">
                {zone.name}
              </Text>
            </Link>
          )}
        />
        {/* With a client in the filter, its name would repeat on every row. */}
        {!client && (
          <Table.Column title="territory.fields.client" name="client" render={(zone) => zone.client_data.name} />
        )}
        <Table.Column
          title="fields.updatedAt"
          name="updated_at"
          sortable
          render={(zone) => dayjs(zone.updated_at).format("DD/MM/YYYY HH:mm")}
        />
        <Table.Column
          title="fields.actions"
          name="_actions"
          width="80px"
          cellAlign="end"
          headerAlign="end"
          render={(zone) => <ZoneContextActions zone={zone} />}
        />
        <Table.Footer.Left>
          <Pagination value={page} onChange={(value) => mergeParams({ page: value })} total={pages} />
        </Table.Footer.Left>
        <Table.Footer.Right>
          <Text size="sm" ta="right">
            {t("territory.zoneResults", { shown: data?.results.length ?? 0, total: data?.count ?? 0 })}
          </Text>
        </Table.Footer.Right>
      </Table>
    </Page>
  )
}
