import { AlertError } from "@/components/AlertError"
import { useAuth } from "@/auth/auth"
import { BlockNavigation } from "@/components/BlockNavigation"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { useTenant } from "@/hooks/useTenant"
import { Badge, Box, Button, Group, Loader, Paper, ScrollArea, SimpleGrid, Stack, Tabs, Text } from "@mantine/core"
import { usePrevious } from "@mantine/hooks"
import { useEffect, useState } from "react"
import { TbBuilding, TbClipboardList, TbPencil, TbUser, TbVectorBezierCircle } from "react-icons/tb"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useUnlockUser, useUpdateUser, useUser } from "../api/users"
import { RolesPermissionsForm } from "../components/RolesPermissionsForm"
import { UpdateUserForm } from "../components/UpdateUserForm"
import { UserContextActions } from "../components/UserContextActions"
import { CheckPermission } from "@/components/CheckPermission"
import { AUTH_CORE_PERMISSIONS } from "../permissions"
import { useTranslation } from "react-i18next"

export function UserDetail() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()

  // URL Params
  const { id: idParam, tab: tabParam } = useParams<{ id: string; tab?: string }>()
  const id = Number(idParam)
  const navigate = useNavigate()

  // Local state
  const [editable, setEditable] = useState(false)

  // React query
  const { data: user } = useUser(id)
  const { tenants, isLoading: tenantsLoading } = useTenant()
  const { mutateAsync: updateUser } = useUpdateUser()
  const { mutateAsync: unlockUser } = useUnlockUser()

  const activeTab = tabParam === "tenants" && !currentUser?.is_staff ? "data" : tabParam || "data"
  const previousTab = usePrevious(activeTab)

  // Effects
  useEffect(() => {
    if (previousTab && activeTab !== previousTab && editable) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditable(false)
    }
  }, [activeTab, previousTab, editable])

  if (!user) {
    return (
      <Page>
        <Loader />
      </Page>
    )
  }

  // Roles and permissions are a user update that also needs the role-write permission.
  const editPermission =
    activeTab === "permissions"
      ? { allOf: [AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI, AUTH_CORE_PERMISSIONS.SCRITTURA_RUOLI] }
      : AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI

  const mainActions: React.ReactNode = (
    <>
      <CheckPermission permission={editPermission}>
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
      <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI}>
        <UserContextActions user={user} onDelete={() => navigate(-1)} />
      </CheckPermission>
    </>
  )
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]))
  const userTenants = user.tenants.map((tenantId) => tenantById.get(tenantId) ?? { id: tenantId, name: `Tenant #${tenantId}`, slug: "", is_active: undefined })

  return (
    <Page>
      <Header
        icon={<TbUser size="1.5rem" />}
        title={user.full_name}
        breadcrumbs={[
          { label: t("users.list.breadcrumb"), href: "/utenti/utenti" },
          { label: user.full_name, href: "#" },
        ]}
        actions={mainActions}
      />
      <Tabs
        value={activeTab}
        onChange={(newTab) => {
          navigate(`/utenti/utenti/${id}/${newTab ?? "data"}`)
        }}
      >
        <Tabs.List grow>
          <Tabs.Tab value="data">
            <Group gap="xxs" justify="center">
              <TbClipboardList />
              <Text size="sm">{t("users.detail.tab")}</Text>
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="permissions">
            <Group gap="xxs" justify="center">
              <TbVectorBezierCircle />
              <Text size="sm">{t("users.detail.rolesTab")}</Text>
            </Group>
          </Tabs.Tab>
          {currentUser?.is_staff && (
            <Tabs.Tab value="tenants">
              <Group gap="xxs" justify="center">
                <TbBuilding />
                <Text size="sm">{t("users.detail.tenants", { count: user.tenants.length })}</Text>
              </Group>
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="data">
          <ScrollArea>
            {!editable && !user.is_active && (
              <Box p="lg" className="standard-border-bottom">
                <AlertError
                  variant="warning"
                  title={t("users.detail.disabledTitle")}
                  message={t("users.detail.disabledMessage")}
                  action={t("users.detail.reactivate")}
                  onAction={() => updateUser({ id: user.id, is_active: true })}
                  actionPermission={AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI}
                />
              </Box>
            )}
            {!editable && user.is_active && user.is_locked && (
              <Box p="lg" className="standard-border-bottom">
                <AlertError
                  title={t("users.detail.lockedTitle")}
                  message={t("users.detail.lockedMessage")}
                  action={t("users.detail.unlock")}
                  onAction={() => {
                    unlockUser(user.id)
                  }}
                  actionPermission={AUTH_CORE_PERMISSIONS.SCRITTURA_UTENTI}
                />
              </Box>
            )}
            <UpdateUserForm
              initialValues={user}
              readonly={!editable}
              onSubmit={async (values) => {
                await updateUser(values)
                setEditable(false)
              }}
              onCancel={() => {
                setEditable(false)
              }}
            />
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="permissions">
          <ScrollArea>
            <RolesPermissionsForm
              initialValues={{ roles: user.roles_data, permissions: user.permissions }}
              readonly={!editable}
              onSubmit={async (values) => {
                await updateUser({
                  id: user.id,
                  permissions: values.permissions,
                  roles: values.roles.map((role) => role.id),
                })
                setEditable(false)
              }}
              onCancel={() => {
                setEditable(false)
              }}
            />
          </ScrollArea>
        </Tabs.Panel>

        {currentUser?.is_staff && (
          <Tabs.Panel value="tenants">
            <ScrollArea>
              <Box p={{ base: "sm", md: "xl" }}>
                {tenantsLoading ? (
                  <Box py="xl" ta="center"><Loader /></Box>
                ) : userTenants.length === 0 ? (
                  <Paper withBorder p="xl" ta="center">
                    <Text fw={600}>{t("users.detail.noTenants")}</Text>
                    <Text size="sm" c="dimmed">{t("users.detail.noTenantsDescription")}</Text>
                  </Paper>
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                    {userTenants.map((tenant) => (
                      <Paper
                        key={tenant.id}
                        component={Link}
                        to={`/tenants/${tenant.id}`}
                        withBorder
                        p="md"
                        c="inherit"
                        style={{ textDecoration: "none" }}
                      >
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Stack gap={2} style={{ minWidth: 0 }}>
                            <Text fw={600} truncate>{tenant.name}</Text>
                            {tenant.slug && <Text size="xs" c="dimmed">{tenant.slug}</Text>}
                          </Stack>
                          {tenant.is_active !== undefined && (
                            <Badge color={tenant.is_active ? "green" : "gray"} variant="light">
                              {t(tenant.is_active ? "users.status.active" : "users.status.inactive")}
                            </Badge>
                          )}
                        </Group>
                      </Paper>
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            </ScrollArea>
          </Tabs.Panel>
        )}
      </Tabs>
      <BlockNavigation
        when={editable}
        title={t("profile.unsavedTitle")}
        message={t("profile.unsavedMessage")}
      />
    </Page>
  )
}
