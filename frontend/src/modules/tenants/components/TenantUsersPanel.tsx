import { TableEmptyState, createTable } from "@/components/Table"
import { requestConfirmation, translateApiError } from "@/utils"
import { Box, Button, Group, Menu, Pagination, Text, TextInput } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { TbDots, TbSearch, TbUserMinus } from "react-icons/tb"
import { useTenantMembers, useRemoveTenantUser, type TenantUser } from "../api/tenants"
import type { Tenant } from "../types"
import { AddTenantUsersButton } from "./ManageTenantUsersAction"
import { useTenant } from "@/hooks/useTenant"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"

const Table = createTable<TenantUser>()

function TenantUserContextActions({ tenant, user }: { tenant: Tenant; user: TenantUser }) {
  const { t } = useTranslation()
  const { mutateAsync: removeUser, isPending } = useRemoveTenantUser(tenant.id)
  const { refreshTenants } = useTenant()

  return (
    <Menu>
      <Menu.Target>
        <Button px="xs" variant="subtle" color="gray" c="gray.7" loading={isPending} aria-label={t("tenants.actionsFor", { name: user.email })}>
          <TbDots size="1.25rem" />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("tenants.actions")}</Menu.Label>
        <Menu.Item
          color="red"
          leftSection={<TbUserMinus />}
          onClick={async () => {
            const confirmed = await requestConfirmation(
              t("tenants.removeUser"),
              <b>{t("tenants.removeUserHeading", { name: user.full_name || user.email })}</b>,
              t("tenants.removeUserMessage")
            )
            if (!confirmed) return
            try {
              await removeUser(user.id)
              refreshTenants()
            } catch (error) {
              notifications.show({
                title: t("tenants.removeUserError"),
                message: translateApiError(
                  error instanceof ApiError ? error.data : null,
                  t("tenants.removeUserErrorMessage"),
                ),
                color: "red",
              })
            }
          }}
        >
          {t("tenants.removeFromTenant")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export function TenantUsersPanel({ tenant }: { tenant: Tenant }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const page = Number.parseInt(params.get("page") || "1", 10)
  const search = params.get("search") || ""
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const { data, isLoading } = useTenantMembers(tenant.id, { page, search: debouncedSearch || undefined })
  const members = data?.results ?? []
  const pages = Math.ceil((data?.count ?? 0) / (data?.page_size || 20))

  const setQuery = (values: Record<string, string | number>) =>
    setParams((current) => {
      Object.entries(values).forEach(([key, value]) => current.set(key, value.toString()))
      return current
    })

  return (
    <>
      <Box py="xs" px="sm">
        <Group justify="flex-start" align="center" gap="xs">
          <TextInput
            size="sm"
            leftSectionPointerEvents="none"
            leftSection={<TbSearch />}
            placeholder={t("common.search")}
            aria-label={t("common.searchLabel")}
            value={search}
            onChange={(event) => setQuery({ search: event.currentTarget.value, page: 1 })}
          />
          {search && <Button variant="subtle" size="xs" color="gray" onClick={() => setParams({ page: "1" })}>{t("common.reset")}</Button>}
        </Group>
      </Box>
      <Table data={members} loading={isLoading} style={{ flexGrow: 1 }}>
      {!isLoading && data?.full_count === 0 && (
        <Table.Extra.BeforeContent>
          <TableEmptyState
            title={t("tenants.noAssociatedUsers")}
            description={t("tenants.noAssociatedUsersDescription")}
            action={<AddTenantUsersButton tenant={tenant} />}
          />
        </Table.Extra.BeforeContent>
      )}
      <Table.HeaderConfig sticky />
      <Table.Column title="users.fields.fullName" name="full_name" render={(user) => <Text fw={500}>{user.full_name || "-"}</Text>} />
      <Table.Column title="users.fields.email" name="email" render={(user) => user.email} />
      <Table.Column
        title="fields.actions"
        name="_actions"
        width="80px"
        cellAlign="end"
        headerAlign="end"
        render={(user) => <TenantUserContextActions tenant={tenant} user={user} />}
      />
      <Table.Footer.Left>
        <Pagination value={page} onChange={(value) => setQuery({ page: value })} total={pages} radius={100} />
      </Table.Footer.Left>
      </Table>
    </>
  )
}
