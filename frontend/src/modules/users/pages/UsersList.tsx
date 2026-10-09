import type { User } from "@/auth/types"
import { Header } from "@/components/Header/Header"
import { Page } from "@/components/Page"
import { TableEmptyState, createTable } from "@/components/Table"
import { Alert, Box, Button, Group, Pagination, Text, TextInput } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { modals } from "@mantine/modals"
import dayjs from "dayjs"
import { useCallback, useMemo, useState } from "react"
import { TbSearch, TbUser } from "react-icons/tb"
import { Link, useSearchParams } from "react-router-dom"
import { useBulkDeleteUsers, useUsers } from "../api/users"
import { CreateUserAction } from "../components/CreateUserAction"
import { RoleFilter } from "../components/RoleFilter"
import { RolePills } from "../components/RolePills"
import { StatusFilter } from "../components/StatusFilter"
import { UserContextActions } from "../components/UserContextActions"
import { UserStatus } from "../components/UserStatus"
import { AUTH_CORE_PERMISSIONS } from "../permissions"
import { CheckPermission } from "@/components/CheckPermission"
import { useTranslation } from "react-i18next"

const Table = createTable<User>()

export function UsersList() {
  const { t } = useTranslation()
  // Query params
  const [params, setParams] = useSearchParams()

  const page = parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  const search = params.get("search") || ""
  const filterRole = params.get("role") || ""
  const filterStatus = params.get("status") || ""

  const hasFilters = !!filterRole || !!filterStatus || !!search

  const mergeParams = useCallback(
    (arg: Record<string, string | number>) => {
      setParams((newParams) => {
        for (const key in arg) {
          newParams.set(key, arg[key].toString())
        }
        return newParams
      })
    },
    [setParams]
  )

  // Local state
  const [selection, setSelection] = useState<number[]>([])

  // React query
  const [debSearch] = useDebouncedValue(search, 300)
  const filters = useMemo(
    () => ({
      page,
      ordering: ordering || undefined,
      search: debSearch || undefined,
      roles: filterRole || undefined,
      status: filterStatus || undefined,
    }),
    [debSearch, page, ordering, filterRole, filterStatus]
  )
  const { data, isLoading: isLoadingUsers } = useUsers(filters)
  const { mutateAsync: bulkDeleteUsers } = useBulkDeleteUsers()

  const numPages = Math.ceil((data?.count ?? 0) / 20)

  // Computed values
  const selectedUsers = useMemo(() => {
    if (!data) return []
    return data.results.filter((user) => selection.includes(user.id))
  }, [data, selection])

  let mainActions: React.ReactNode = (
    <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI}>
      <CreateUserAction />
    </CheckPermission>
  )
  if (selection.length > 0) {
    mainActions = (
      <>
        <Button
          variant="subtle"
          color="gray"
          onClick={() => {
            setSelection([])
          }}
        >
          {t("common.cancel")}
        </Button>
        <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI}>
          <Button
            color="red.8"
            onClick={() => {
              modals.openConfirmModal({
                title: t("users.list.deleteTitle"),
                children: (
                  <>
                    <Alert
                      color="red"
                      title={
                        <Text size="sm" c="red.9">
                          {t("users.list.deletePrompt")}{" "}
                          <b>{selectedUsers.map((u) => u.full_name).join(", ")}</b>
                        </Text>
                      }
                    >
                      <Text size="sm">{t("users.irreversible")}</Text>
                    </Alert>
                  </>
                ),
                labels: { confirm: t("common.confirm"), cancel: t("common.cancel") },
                confirmProps: { color: "red.9" },
                cancelProps: { color: "gray", variant: "subtle" },
                onCancel: () => {},
                onConfirm: async () => {
                  await bulkDeleteUsers({ ids: selectedUsers.map((u) => u.id) })
                  setSelection([])
                },
              })
            }}
          >
            {t("users.list.deleteTitle")}
          </Button>
        </CheckPermission>
      </>
    )
  }

  return (
    <Page>
      <Header
        icon={<TbUser size="1.5rem" />}
        title={t("users.list.title")}
        breadcrumbs={[{ label: t("users.list.breadcrumb"), href: "#" }]}
        actions={mainActions}
      />
      <Box py="xs" px="sm">
        <Group justify="flex-start" align="center" gap="xs">
          <TextInput
            size="sm"
            leftSectionPointerEvents="none"
            leftSection={<TbSearch />}
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => {
              setSelection([])
              mergeParams({ search: e.target.value, page: 1 })
            }}
          />
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.LETTURA_RUOLI}>
            <RoleFilter
              value={filterRole ? parseInt(filterRole, 10) : null}
              onChange={(value) => {
                setSelection([])
                mergeParams({ role: value ? value.toString() : "", page: 1 })
              }}
            />
          </CheckPermission>
          <StatusFilter
            value={filterStatus || null}
            onChange={(value) => {
              setSelection([])
              mergeParams({ status: value ? value.toString() : "", page: 1 })
            }}
          />
          <Box flex={1} />
          {hasFilters && (
            <Button
              variant="subtle"
              size="xs"
              color="gray"
              onClick={() => {
                setParams({ page: "1" })
              }}
            >
              {t("common.reset")}
            </Button>
          )}
        </Group>
      </Box>
      <Table
        data={data?.results || []}
        loading={isLoadingUsers}
        style={{ flexGrow: 1 }}
        orderBy={ordering.replace("-", "")}
        orderDirection={ordering.startsWith("-") ? "desc" : "asc"}
        onOrderChange={(field, direction) => {
          if (field) {
            if (direction === "desc") {
              mergeParams({ ordering: `-${field}` })
            } else {
              mergeParams({ ordering: field })
            }
          } else {
            mergeParams({ ordering: "" })
          }
          if (numPages > 1) {
            setSelection([])
          }
        }}
      >
        {data?.full_count === 0 && (
          <Table.Extra.BeforeContent>
            <TableEmptyState
              title={t("users.list.emptyTitle")}
              description={t("users.list.emptyDescription")}
              action={
                <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI}>
                  <CreateUserAction />
                </CheckPermission>
              }
            />
          </Table.Extra.BeforeContent>
        )}
        <Table.HeaderConfig sticky />
        <Table.Column
          title="users.fields.fullName"
          name="full_name"
          sortable
          render={(user) => (
            <Link to={`/utenti/utenti/${user.id}`}>
              <Text td="underline">{user.full_name}</Text>
            </Link>
          )}
        />
        <Table.Column title="users.fields.email" name="email" render={(user) => user.email} />
        <Table.Column title="users.fields.roles" name="roles" render={(user) => <RolePills roles={user.roles_data} display={1} />} />
        <Table.Column title="fields.status" name="status" render={(user) => <UserStatus status={user.status} />} />
        <Table.Column
          title="users.fields.lastLogin"
          name="last_login"
          sortable
          render={(user) => (user.last_login ? dayjs(user.last_login).format("DD/MM/YYYY HH:mm") : "-")}
        />
        <Table.Column
          title="fields.actions"
          name="_actions"
          width="80px"
          cellStyle={{ paddingRight: 0 }}
          render={(user) => (
            <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI}>
              <UserContextActions user={user} />
            </CheckPermission>
          )}
          cellAlign="end"
          headerAlign="end"
        />

        <Table.Selection selectionField="id" selectedRows={selection} onSelectionChange={setSelection} />

        <Table.Footer.Left>
          <Pagination
            value={page}
            onChange={(page) => {
              setSelection([])
              mergeParams({ page })
            }}
            total={numPages}
            radius={100}
          />
        </Table.Footer.Left>

        <Table.Footer.Right>
          <Text size="sm" ta="right">
            {t("users.results", { shown: data?.results.length ?? 0, total: data?.full_count ?? 0 })}
          </Text>
        </Table.Footer.Right>
      </Table>
    </Page>
  )
}
