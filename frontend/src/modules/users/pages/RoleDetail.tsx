import { BlockNavigation } from "@/components/BlockNavigation"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { TableEmptyState } from "@/components/Table"
import { Alert, Box, Button, Group, Loader, ScrollArea, Tabs, Text, TextInput } from "@mantine/core"
import { useDebouncedValue, usePrevious } from "@mantine/hooks"
import { useEffect, useMemo, useState } from "react"
import { TbClipboardList, TbPencil, TbSearch, TbUser, TbUserX, TbVectorBezierCircle } from "react-icons/tb"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useRole, useUpdateRole } from "../api/roles"
import { UpdateRoleForm } from "../components/UpdateRoleForm"
import { useUsers } from "../api/users"
import GrantRoleToUsersAction from "../components/GrantRoleToUsersAction"
import RoleUsersTable from "../components/RoleUsersTable"
import { modals } from "@mantine/modals"
import { CheckPermission } from "@/components/CheckPermission"
import { AUTH_CORE_PERMISSIONS } from "../permissions"
import { useTranslation } from "react-i18next"

export function RoleDetail() {
  const { t } = useTranslation()
  // URL Params
  const { id: idParam, tab: tabParam } = useParams<{ id: string; tab?: string }>()
  const id = Number(idParam)
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get("page") || "1", 10)
  const ordering = params.get("ordering") || ""
  const search = params.get("search") || ""
  const navigate = useNavigate()

  const [debSearch] = useDebouncedValue(search, 300)

  // Local state
  const [editable, setEditable] = useState(false)
  const [selection, setSelection] = useState<number[]>([])

  const filters = useMemo(
    () => ({ page, ordering, search: debSearch, _sf_roles: id?.toString() }),
    [debSearch, page, ordering, id]
  )

  // React query
  const { data: role } = useRole(id)
  const { mutateAsync: updateRole } = useUpdateRole()
  const { data: usersWithRole, isLoading: isLoadingUsers, refetch: refetchUsers } = useUsers(filters)

  const selectedUsers = useMemo(() => {
    if (!usersWithRole || tabParam !== "users") return []
    return usersWithRole.results.filter((user) => selection.includes(user.id))
  }, [usersWithRole, selection, tabParam])

  const usersEmptyContent =
    usersWithRole?.full_count === 0 ? (
      <TableEmptyState
        title={t("roles.detail.emptyTitle")}
        description={t("roles.detail.emptyDescription")}
        action={
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI}>
            <GrantRoleToUsersAction id={id} refetchUsers={refetchUsers} setSelection={setSelection} />
          </CheckPermission>
        }
      />
    ) : null

  const activeTab = tabParam || "data"
  const previousTab = usePrevious(activeTab)

  // Effects
  useEffect(() => {
    if (previousTab && activeTab !== previousTab && editable) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditable(false)
    }
  }, [activeTab, previousTab, editable])

  if (!role) {
    return (
      <Page>
        <Loader />
      </Page>
    )
  }

  let mainActionsRole: React.ReactNode = (
    <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_RUOLI}>
      <Button
        leftSection={<TbPencil />}
        disabled={editable}
        onClick={() => {
          setEditable(true)
        }}
      >
        {t("common.edit")}
      </Button>
    </CheckPermission>
  )
  if (activeTab === "users") {
    mainActionsRole = (
      <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI}>
        <GrantRoleToUsersAction id={id} refetchUsers={refetchUsers} setSelection={setSelection} />
      </CheckPermission>
    )
  }
  if (selection.length > 0 && activeTab === "users") {
    mainActionsRole = (
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
            leftSection={<TbUserX />}
            color="red.8"
            onClick={() => {
              modals.openConfirmModal({
                title: t("roles.detail.removeSelected"),
                children: (
                  <>
                    <Alert
                      color="red"
                      title={
                        <Text size="sm" c="red.9">
                          {t("roles.detail.removeSelectedPrompt")}{" "}
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
                onCancel: () => console.log("Cancel"),
                onConfirm: () => console.log("Confirmed"),
              })
            }}
          >
            {t("roles.detail.removeSelected")}
          </Button>
        </CheckPermission>
      </>
    )
  }

  return (
    <Page>
      <Header
        icon={<TbVectorBezierCircle size="1.5rem" />}
        title={role.name}
        breadcrumbs={[
          { label: t("roles.list.breadcrumb"), href: "/utenti/ruoli" },
          { label: role.name, href: "#" },
        ]}
        actions={mainActionsRole}
      />
      <Tabs
        value={activeTab}
        onChange={(newTab) => {
          navigate(`/utenti/ruoli/${id}/${newTab ?? "data"}`)
        }}
      >
        <Tabs.List grow>
          <Tabs.Tab value="data">
            <Group gap="xxs" justify="center">
              <TbClipboardList />
              <Text size="sm">{t("roles.detail.tab")}</Text>
            </Group>
          </Tabs.Tab>
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.LETTURA_UTENTI}>
            <Tabs.Tab value="users">
              <Group gap="xxs" justify="center">
                <TbUser />
                <Text size="sm">{t("roles.detail.usersTab")}</Text>
              </Group>
            </Tabs.Tab>
          </CheckPermission>
        </Tabs.List>

        <Tabs.Panel value="data">
          <ScrollArea>
            <UpdateRoleForm
              initialValues={role}
              readonly={!editable}
              onSubmit={async (values) => {
                await updateRole(values)
                setEditable(false)
              }}
              onCancel={() => {
                setEditable(false)
              }}
            />
          </ScrollArea>
        </Tabs.Panel>

        <CheckPermission permission={AUTH_CORE_PERMISSIONS.LETTURA_UTENTI}>
          <Tabs.Panel className="panel-with-table" value="users">
            <Box py="xs" px="sm">
              <Group justify="flex-start" align="center" gap="xs">
                <TextInput
                  size="xs"
                  leftSectionPointerEvents="none"
                  leftSection={<TbSearch />}
                  placeholder={t("common.search")}
                  value={search}
                  onChange={(e) =>
                    setParams({ ...Object.fromEntries(params), search: e.currentTarget.value, page: "1" })
                  }
                />
              </Group>
            </Box>
            <RoleUsersTable
              id={id}
              usersWithRole={usersWithRole}
              isLoadingUsers={isLoadingUsers}
              selection={selection}
              setSelection={setSelection}
              emptyContent={usersEmptyContent}
            />
          </Tabs.Panel>
        </CheckPermission>
      </Tabs>
      <BlockNavigation
        when={editable}
        title={t("profile.unsavedTitle")}
        message={t("profile.unsavedMessage")}
      />
    </Page>
  )
}
