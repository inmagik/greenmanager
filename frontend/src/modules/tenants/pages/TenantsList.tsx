import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { TableEmptyState, createTable } from "@/components/Table"
import { Alert, Badge, Box, Button, Group, Pagination, Text, TextInput } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { modals } from "@mantine/modals"
import dayjs from "dayjs"
import { useMemo, useState } from "react"
import { TbBuilding, TbSearch } from "react-icons/tb"
import { useSearchParams } from "react-router-dom"
import { Link } from "react-router-dom"
import { useBulkDeleteTenants, useTenants } from "../api/tenants"
import { CreateTenantAction } from "../components/CreateTenantAction"
import { TenantContextActions } from "../components/TenantContextActions"
import type { Tenant } from "../types"
import { useTenant } from "@/hooks/useTenant"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { notifications } from "@mantine/notifications"
import { useTranslation } from "react-i18next"
import { translateApiError } from "@/utils"

const Table = createTable<Tenant>()

export function TenantsList() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const page = Number.parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  const search = params.get("search") || ""
  const [selection, setSelection] = useState<number[]>([])
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const filters = useMemo(
    () => ({ page, ordering: ordering || undefined, search: debouncedSearch || undefined }),
    [page, ordering, debouncedSearch]
  )
  const { data, isLoading } = useTenants(filters)
  const { mutateAsync: bulkDelete } = useBulkDeleteTenants()
  const { refreshTenants } = useTenant()
  const selectedTenants = data?.results.filter((tenant) => selection.includes(tenant.id)) ?? []
  const pages = Math.ceil((data?.count ?? 0) / 20)
  const setQuery = (values: Record<string, string | number>) =>
    setParams((current) => {
      Object.entries(values).forEach(([key, value]) => current.set(key, value.toString()))
      return current
    })

  const actions = selection.length ? (
    <>
      <Button variant="subtle" color="gray" onClick={() => setSelection([])}>{t("common.cancel")}</Button>
      <Button
        color="red.8"
        onClick={() =>
          modals.openConfirmModal({
            title: t("tenants.deleteTenants"),
            children: (
              <Alert color="red" title={t("tenants.deleteWarning")}>
                <Text size="sm">{t("tenants.deleteTenantsHeading", { names: selectedTenants.map(({ name }) => name).join(", ") })}</Text>
              </Alert>
            ),
            labels: { confirm: t("common.confirm"), cancel: t("common.cancel") },
            confirmProps: { color: "red.9" },
            onConfirm: async () => {
              try {
                await bulkDelete({ ids: selection })
                refreshTenants()
                setSelection([])
              } catch (error) {
                const detail = translateApiError(
                  error instanceof ApiError ? error.data : null,
                  t("tenants.deleteTenantsErrorMessage"),
                )
                notifications.show({ title: t("tenants.deleteTenantsError"), message: detail, color: "red" })
              }
            },
          })
        }
      >
        {t("tenants.deleteTenants")}
      </Button>
    </>
  ) : <CreateTenantAction />

  return (
    <Page>
      <Header
        icon={<TbBuilding size="1.5rem" />}
        title={t("tenants.title")}
        breadcrumbs={[{ label: t("tenants.administration"), href: "#" }]}
        actions={actions}
      />
      <Box py="xs" px="sm">
        <Group gap="xs">
          <TextInput
            size="sm"
            leftSection={<TbSearch />}
            leftSectionPointerEvents="none"
            placeholder={t("tenants.searchPlaceholder")}
            value={search}
            onChange={(event) => {
              setSelection([])
              setQuery({ search: event.currentTarget.value, page: 1 })
            }}
          />
          {search && (
            <Button variant="subtle" size="xs" color="gray" onClick={() => setParams({ page: "1" })}>{t("common.reset")}</Button>
          )}
        </Group>
      </Box>
      <Table
        data={data?.results ?? []}
        loading={isLoading}
        style={{ flexGrow: 1 }}
        orderBy={ordering.replace("-", "")}
        orderDirection={ordering.startsWith("-") ? "desc" : "asc"}
        onOrderChange={(field, direction) => {
          setSelection([])
          setQuery({ ordering: field ? `${direction === "desc" ? "-" : ""}${field}` : "" })
        }}
      >
        {data?.full_count === 0 && (
          <Table.Extra.BeforeContent>
            <TableEmptyState
              title={t("tenants.emptyTitle")}
              description={t("tenants.emptyDescription")}
              action={<CreateTenantAction />}
            />
          </Table.Extra.BeforeContent>
        )}
        <Table.HeaderConfig sticky />
        <Table.Column
          title="fields.name"
          name="name"
          sortable
          render={(tenant) => <Link to={`/tenants/${tenant.id}`}><Text fw={500} td="underline">{tenant.name}</Text></Link>}
        />
        <Table.Column title="tenants.fields.slug" name="slug" sortable render={(tenant) => tenant.slug} />
        <Table.Column title="tenants.fields.users" name="user_count" render={(tenant) => tenant.user_count} />
        <Table.Column
          title="fields.status"
          name="is_active"
          render={(tenant) => <Badge color={tenant.is_active ? "green" : "gray"}>{t(tenant.is_active ? "tenants.active" : "tenants.inactive")}</Badge>}
        />
        <Table.Column
          title={t("tenants.created")}
          name="created_at"
          sortable
          render={(tenant) => dayjs(tenant.created_at).format("DD/MM/YYYY HH:mm")}
        />
        <Table.Column
          title="fields.actions"
          name="_actions"
          width="80px"
          cellAlign="end"
          headerAlign="end"
          render={(tenant) => <TenantContextActions tenant={tenant} />}
        />
        <Table.Selection
          selectionField="id"
          selectedRows={selection}
          onSelectionChange={setSelection}
          getRowLabel={(tenant) => tenant.name}
        />
        <Table.Footer.Left>
          <Pagination value={page} onChange={(value) => { setSelection([]); setQuery({ page: value }) }} total={pages} />
        </Table.Footer.Left>
      </Table>
    </Page>
  )
}
