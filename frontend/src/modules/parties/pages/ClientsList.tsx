import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { TableEmptyState, createTable } from "@/components/Table"
import { useUrlParams } from "@/hooks/useUrlParams"
import { Badge, Box, Button, Group, Pagination, Select, Text, TextInput } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { TbBriefcase, TbChevronDown, TbSearch } from "react-icons/tb"
import { Link } from "react-router-dom"
import { useClients, type ClientFilters } from "../api/clients"
import { ClientContextActions } from "../components/ClientContextActions"
import { CreateClientAction } from "../components/CreateClientAction"
import { PARTIES_PERMISSIONS } from "../permissions"
import { CLIENT_KINDS, type Client, type ClientKind } from "../types"

const Table = createTable<Client>()

export function ClientsList() {
  const { t } = useTranslation()
  const [params, setParams, mergeParams] = useUrlParams()
  const page = Number.parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  const search = params.get("search") || ""
  const status = params.get("status") || ""
  const kind = params.get("kind") || ""
  const hasFilters = !!search || !!status || !!kind
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const filters = useMemo<ClientFilters>(
    () => ({
      page,
      ordering: ordering || undefined,
      search: debouncedSearch || undefined,
      active: status === "active" ? "true" : status === "inactive" ? "false" : undefined,
      kind: (kind as ClientKind) || undefined,
    }),
    [page, ordering, debouncedSearch, status, kind]
  )
  const { data, isLoading } = useClients(filters)
  const pages = Math.ceil((data?.count ?? 0) / (data?.page_size || 20))
  const createAction = (
    <CheckPermission permission={PARTIES_PERMISSIONS.WRITE_CLIENTS}>
      <CreateClientAction />
    </CheckPermission>
  )

  return (
    <Page>
      <Header
        icon={<TbBriefcase size="1.5rem" />}
        title={t("parties.title")}
        breadcrumbs={[{ label: t("parties.title"), href: "#" }]}
        actions={createAction}
      />
      <Box py="xs" px="sm">
        <Group gap="xs">
          <TextInput
            size="sm"
            leftSection={<TbSearch />}
            leftSectionPointerEvents="none"
            placeholder={t("parties.searchPlaceholder")}
            aria-label={t("common.searchLabel")}
            value={search}
            onChange={(event) => mergeParams({ search: event.currentTarget.value, page: 1 })}
          />
          <Select
            size="sm"
            clearable
            rightSection={<TbChevronDown size="1rem" />}
            placeholder={t("parties.filters.status")}
            aria-label={t("parties.filters.status")}
            data={[
              { value: "active", label: t("parties.active") },
              { value: "inactive", label: t("parties.inactive") },
            ]}
            value={status || null}
            onChange={(value) => mergeParams({ status: value ?? "", page: 1 })}
          />
          <Select
            size="sm"
            clearable
            rightSection={<TbChevronDown size="1rem" />}
            placeholder={t("parties.filters.kind")}
            aria-label={t("parties.filters.kind")}
            data={CLIENT_KINDS.map((value) => ({ value, label: t(`parties.kinds.${value}`) }))}
            value={kind || null}
            onChange={(value) => mergeParams({ kind: value ?? "", page: 1 })}
          />
          {hasFilters && (
            <Button variant="subtle" size="xs" color="gray" onClick={() => setParams({ page: "1" })}>
              {t("common.reset")}
            </Button>
          )}
        </Group>
      </Box>
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
              title={t("parties.emptyTitle")}
              description={t("parties.emptyDescription")}
              action={createAction}
            />
          </Table.Extra.BeforeContent>
        )}
        <Table.HeaderConfig sticky />
        <Table.Column
          title="parties.fields.name"
          name="name"
          sortable
          render={(client) => (
            <Link to={`/parties/clients/${client.id}`}>
              <Text fw={500} td="underline">
                {client.name}
              </Text>
            </Link>
          )}
        />
        <Table.Column title="parties.fields.kind" name="kind" render={(client) => t(`parties.kinds.${client.kind}`)} />
        <Table.Column title="parties.fields.taxCode" name="tax_code" render={(client) => client.tax_code || "—"} />
        <Table.Column
          title="parties.fields.istatCode"
          name="istat_code"
          render={(client) => client.istat_code || "—"}
        />
        <Table.Column
          title="fields.status"
          name="active"
          render={(client) => (
            <Badge color={client.active ? "green" : "gray"}>
              {t(client.active ? "parties.active" : "parties.inactive")}
            </Badge>
          )}
        />
        <Table.Column
          title="fields.updatedAt"
          name="updated_at"
          sortable
          render={(client) => dayjs(client.updated_at).format("DD/MM/YYYY HH:mm")}
        />
        <Table.Column
          title="fields.actions"
          name="_actions"
          width="80px"
          cellAlign="end"
          headerAlign="end"
          render={(client) => <ClientContextActions client={client} />}
        />
        <Table.Footer.Left>
          <Pagination value={page} onChange={(value) => mergeParams({ page: value })} total={pages} />
        </Table.Footer.Left>
        <Table.Footer.Right>
          <Text size="sm" ta="right">
            {t("parties.results", { shown: data?.results.length ?? 0, total: data?.count ?? 0 })}
          </Text>
        </Table.Footer.Right>
      </Table>
    </Page>
  )
}
