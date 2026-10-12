import { AlertError } from "@/components/AlertError"
import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { TableEmptyState, createTable } from "@/components/Table"
import { useUrlParams } from "@/hooks/useUrlParams"
import { translateApiError } from "@/utils"
import { Box, Button, Group, Pagination, Select, Text, TextInput } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { TbChevronDown, TbPlus, TbSearch } from "react-icons/tb"
import { Link } from "react-router-dom"
import type { CatalogFilters } from "../api/createCatalogApi"
import { openEntryCreate } from "../components/catalogModals"
import { CatalogEntryActions } from "../components/CatalogEntryActions"
import { ScopeBadge, StatusBadge } from "../components/EntryBadges"
import type { CatalogDefinition } from "../definitions"
import { enumLabel, fieldLabel, formatField } from "../fields"
import { useCatalogPermissions } from "../hooks/useCatalogPermissions"
import { CATALOGS_PERMISSIONS } from "../permissions"
import type { CatalogEntry } from "../types"

const Table = createTable<CatalogEntry>()

// The status filter of the list, as filters of the server.
const STATUS_FILTERS: Record<string, CatalogFilters> = {
  available: { available: "true" },
  unavailable: { available: "false" },
  hidden: { hidden: "true" },
  retired: { retired: "true" },
}

/** The entries of a catalog, driven by its definition: columns and filters beyond the common ones. */
export function CatalogEntriesList({ catalog }: { catalog: CatalogDefinition }) {
  const { t } = useTranslation()
  const [params, setParams, mergeParams] = useUrlParams()
  const { canCreate } = useCatalogPermissions(catalog)
  const { mutateAsync: createEntry } = catalog.api.useCreateEntry()
  const page = Number.parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  const search = params.get("search") || ""
  const status = params.get("status") || ""
  const scope = catalog.extensible ? params.get("scope") || "" : ""
  const enumFilters = catalog.fields.filter((field) => field.kind === "enum" && catalog.filters.includes(field.name))
  // A value that is not among the options (an edited URL) is ignored: the server would refuse it.
  const fieldFilters = Object.fromEntries(
    enumFilters.flatMap((field) => {
      const value = params.get(field.name)
      return field.kind === "enum" && value && field.options.includes(value) ? [[field.name, value]] : []
    })
  )
  const fieldFiltersKey = JSON.stringify(fieldFilters)
  const hasFilters = !!search || !!status || !!scope || Object.keys(fieldFilters).length > 0
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const filters = useMemo<CatalogFilters>(
    () => ({
      page,
      ordering: ordering || undefined,
      search: debouncedSearch || undefined,
      ...STATUS_FILTERS[status],
      scope: scope === "system" || scope === "organization" ? scope : undefined,
      ...JSON.parse(fieldFiltersKey),
    }),
    [page, ordering, debouncedSearch, status, scope, fieldFiltersKey]
  )
  const { data, isLoading, error } = catalog.api.useEntries(filters)
  const pages = Math.ceil((data?.count ?? 0) / (data?.page_size || 20))
  const title = t(`catalogs.${catalog.key}.title`)
  const statusOptions = Object.keys(STATUS_FILTERS)
    .filter((value) => catalog.extensible || value !== "hidden")
    .map((value) => ({ value, label: t(`catalogs.status.${value}`) }))
  const createAction = canCreate && (
    <CheckPermission permission={CATALOGS_PERMISSIONS.WRITE_CATALOGS}>
      <Button leftSection={<TbPlus />} onClick={() => openEntryCreate(catalog, createEntry, t)}>
        {t("catalogs.newEntry")}
      </Button>
    </CheckPermission>
  )

  return (
    <Page>
      <Header
        icon={<catalog.icon size="1.5rem" />}
        title={title}
        breadcrumbs={[
          { label: t("catalogs.title"), href: "/catalogs" },
          { label: title, href: "#" },
        ]}
        actions={createAction}
      />
      <Box py="xs" px="sm">
        <Group gap="xs">
          <TextInput
            size="sm"
            w={300}
            maw="100%"
            leftSection={<TbSearch />}
            leftSectionPointerEvents="none"
            placeholder={t([`catalogs.${catalog.key}.searchPlaceholder`, "catalogs.searchPlaceholder"])}
            aria-label={t("common.searchLabel")}
            value={search}
            onChange={(event) => mergeParams({ search: event.currentTarget.value, page: 1 })}
          />
          {enumFilters.map(
            (field) =>
              field.kind === "enum" && (
                <Select
                  key={field.name}
                  size="sm"
                  clearable
                  rightSection={<TbChevronDown size="1rem" />}
                  placeholder={fieldLabel(t, catalog, field.name)}
                  aria-label={fieldLabel(t, catalog, field.name)}
                  data={field.options.map((value) => ({ value, label: enumLabel(t, field.name, value) }))}
                  value={fieldFilters[field.name] ?? null}
                  onChange={(value) => mergeParams({ [field.name]: value ?? "", page: 1 })}
                />
              )
          )}
          {catalog.extensible && (
            <Select
              size="sm"
              clearable
              rightSection={<TbChevronDown size="1rem" />}
              placeholder={t("catalogs.filters.scope")}
              aria-label={t("catalogs.filters.scope")}
              data={[
                { value: "system", label: t("catalogs.scope.system") },
                { value: "organization", label: t("catalogs.scope.organization") },
              ]}
              value={scope || null}
              onChange={(value) => mergeParams({ scope: value ?? "", page: 1 })}
            />
          )}
          <Select
            size="sm"
            clearable
            rightSection={<TbChevronDown size="1rem" />}
            placeholder={t("catalogs.filters.status")}
            aria-label={t("catalogs.filters.status")}
            data={statusOptions}
            value={status || null}
            onChange={(value) => mergeParams({ status: value ?? "", page: 1 })}
          />
          {hasFilters && (
            <Button
              variant="subtle"
              size="xs"
              color="gray"
              onClick={() => setParams(ordering ? { page: "1", ordering } : { page: "1" })}
            >
              {t("common.reset")}
            </Button>
          )}
        </Group>
      </Box>
      {error && (
        <Box px="sm" pb="xs">
          <AlertError title={t("catalogs.loadError")} message={translateApiError(error, t("common.unexpectedError"))} />
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
              title={t("catalogs.emptyTitle")}
              description={t(`catalogs.${catalog.key}.description`)}
              action={createAction}
            />
          </Table.Extra.BeforeContent>
        )}
        {!!data?.full_count && data.count === 0 && (
          <Table.Extra.BeforeContent>
            <TableEmptyState title={t("common.noResults")} description={t("catalogs.noResultsDescription")} />
          </Table.Extra.BeforeContent>
        )}
        <Table.HeaderConfig sticky />
        <Table.Column
          // Translated here: a catalog may have its own label. The labels have no dots, which Table would translate.
          title={fieldLabel(t, catalog, catalog.nameField)}
          name={catalog.nameOrdering}
          sortable
          render={(entry) => (
            <Link to={`/catalogs/${catalog.slug}/${entry.id}`}>
              <Text fw={500} td="underline">
                {entry.name}
              </Text>
            </Link>
          )}
        />
        <Table.Column title="catalogs.fields.code" name="code" sortable render={(entry) => entry.code} />
        {catalog.columns.map((name) => {
          const field = catalog.fields.find((candidate) => candidate.name === name)!
          return (
            <Table.Column
              key={name}
              title={fieldLabel(t, catalog, name)}
              name={name}
              render={(entry) => formatField(t, field, (entry as Record<string, unknown>)[name])}
            />
          )
        })}
        {catalog.extensible && (
          <Table.Column
            title="catalogs.filters.scope"
            name="is_system"
            render={(entry) => <ScopeBadge entry={entry} />}
          />
        )}
        <Table.Column title="fields.status" name="status" render={(entry) => <StatusBadge entry={entry} />} />
        <Table.Column
          title="fields.actions"
          name="_actions"
          width="80px"
          cellAlign="end"
          headerAlign="end"
          render={(entry) => <CatalogEntryActions catalog={catalog} entry={entry} />}
        />
        <Table.Footer.Left>
          <Pagination value={page} onChange={(value) => mergeParams({ page: value })} total={pages} />
        </Table.Footer.Left>
        <Table.Footer.Right>
          <Text size="sm" ta="right">
            {t("catalogs.results", { shown: data?.results.length ?? 0, total: data?.count ?? 0 })}
          </Text>
        </Table.Footer.Right>
      </Table>
    </Page>
  )
}
