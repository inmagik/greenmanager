import { AlertError } from "@/components/AlertError"
import { Button, Group, Loader, Menu, MultiSelect, Pagination, Stack, Text } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import { useState } from "react"
import { TbUserPlus } from "react-icons/tb"
import { useAddTenantUsers, useAvailableTenantUsers, type TenantUser } from "../api/tenants"
import type { Tenant } from "../types"
import { useTenant } from "@/hooks/useTenant"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { translateApiError } from "@/utils"

function AddTenantUsersForm({ tenant, onSaved }: { tenant: Tenant; onSaved: () => void }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const { data, isLoading, isError } = useAvailableTenantUsers(tenant.id, { page, search: debouncedSearch || undefined })
  const { mutateAsync: addUsers, isPending } = useAddTenantUsers(tenant.id)
  const { refreshTenants } = useTenant()
  const [selection, setSelection] = useState<TenantUser[]>([])
  const availableUsers = data?.results ?? []
  const usersById = new Map(
    [...availableUsers, ...selection].map((user) => [user.id.toString(), user] as const),
  )
  const options = Array.from(usersById.values()).map((user) => ({
    value: user.id.toString(),
    label: user.full_name ? `${user.full_name} (${user.email})` : user.email,
  }))
  const pages = Math.ceil((data?.count ?? 0) / (data?.page_size || 20))

  if (isLoading) return <Loader size="sm" />
  if (isError) return <AlertError title={t("tenants.loadUsersError")} message={t("tenants.tryAgainLater")} />

  return (
    <Stack gap="md">
      {availableUsers.length || selection.length || search ? (
        <MultiSelect
          searchable
          label={t("tenants.usersLabel")}
          description={t("tenants.availableUsersDescription")}
          placeholder={t("tenants.searchUsers")}
          data={options}
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); setPage(1) }}
          value={selection.map((user) => user.id.toString())}
          onChange={(ids) => setSelection(ids.flatMap((id) => {
            const user = usersById.get(id)
            return user ? [user] : []
          }))}
        />
      ) : <Text c="dimmed" size="sm">{t("tenants.allUsersAssociated")}</Text>}
      {pages > 1 && <Pagination value={page} onChange={setPage} total={pages} size="sm" />}
      <Group justify="flex-end">
        <Button
          disabled={!selection.length}
          loading={isPending}
          onClick={async () => {
            try {
              await addUsers(selection.map((user) => user.id))
              refreshTenants()
              onSaved()
            } catch (error) {
              notifications.show({
                title: t("tenants.addUsersError"),
                message: translateApiError(
                  error instanceof ApiError ? error.data : null,
                  t("tenants.addUsersErrorMessage"),
                ),
                color: "red",
              })
            }
          }}
        >
          {t("tenants.addUsers")}
        </Button>
      </Group>
    </Stack>
  )
}

function openAddUsersModal(tenant: Tenant, t: TFunction) {
  const modalId = modals.open({
    title: t("tenants.addUsersTo", { name: tenant.name }),
    size: "lg",
    children: <AddTenantUsersForm tenant={tenant} onSaved={() => modals.close(modalId)} />,
  })
}

export function AddTenantUsersMenuItem({ tenant }: { tenant: Tenant }) {
  const { t } = useTranslation()
  return <Menu.Item leftSection={<TbUserPlus />} onClick={() => openAddUsersModal(tenant, t)}>{t("tenants.addUsers")}</Menu.Item>
}

export function AddTenantUsersButton({ tenant }: { tenant: Tenant }) {
  const { t } = useTranslation()
  return <Button leftSection={<TbUserPlus />} onClick={() => openAddUsersModal(tenant, t)}>{t("tenants.addUsers")}</Button>
}
