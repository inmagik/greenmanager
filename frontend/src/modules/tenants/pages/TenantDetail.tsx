import { BlockNavigation } from "@/components/BlockNavigation"
import { QueryErrorPage } from "@/components/StatusPage"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { Button, Center, Group, Loader, ScrollArea, Tabs, Text } from "@mantine/core"
import { usePrevious } from "@mantine/hooks"
import { useEffect, useState } from "react"
import { TbBuilding, TbClipboardList, TbPencil, TbUsers } from "react-icons/tb"
import { useNavigate, useParams } from "react-router-dom"
import { useTenantDetail, useUpdateTenant } from "../api/tenants"
import { AddTenantUsersButton } from "../components/ManageTenantUsersAction"
import { TenantForm } from "../components/TenantForm"
import { TenantUsersPanel } from "../components/TenantUsersPanel"
import { useTenant } from "@/hooks/useTenant"
import { useTranslation } from "react-i18next"

export function TenantDetail() {
  const { t } = useTranslation()
  const { id: idParam, tab: tabParam } = useParams<{ id: string; tab?: string }>()
  const id = Number(idParam)
  const navigate = useNavigate()
  const activeTab = tabParam === "users" ? "users" : "info"
  const previousTab = usePrevious(activeTab)
  const [editable, setEditable] = useState(false)
  const { data: tenant, isLoading, error: tenantError } = useTenantDetail(id)
  const { mutateAsync: updateTenant } = useUpdateTenant()
  const { refreshTenants } = useTenant()

  useEffect(() => {
    // Keep edit mode local to the information tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (previousTab && previousTab !== activeTab) setEditable(false)
  }, [activeTab, previousTab])

  if (tenantError) return <QueryErrorPage error={tenantError} />
  if (isLoading || !tenant) return <Page><Center p="xl"><Loader /></Center></Page>

  return (
    <Page>
      <Header
        icon={<TbBuilding size="1.5rem" />}
        title={tenant.name}
        breadcrumbs={[{ label: t("tenants.title"), href: "/tenants" }, { label: tenant.name, href: "#" }]}
        actions={activeTab === "users"
          ? <AddTenantUsersButton tenant={tenant} />
          : <Button leftSection={<TbPencil />} disabled={editable} onClick={() => setEditable(true)}>{t("tenants.edit")}</Button>}
      />
      <Tabs value={activeTab} onChange={(tab) => navigate(`/tenants/${id}/${tab ?? "info"}`)}>
        <Tabs.List grow>
          <Tabs.Tab value="info">
            <Group gap="xxs" justify="center"><TbClipboardList /><Text size="sm">{t("tenants.details")}</Text></Group>
          </Tabs.Tab>
          <Tabs.Tab value="users">
            <Group gap="xxs" justify="center"><TbUsers /><Text size="sm">{t("tenants.associatedUsers", { count: tenant.user_count })}</Text></Group>
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="info">
          <ScrollArea>
            <TenantForm
              initialValues={tenant}
              readonly={!editable}
              layout="page"
              onCancel={() => setEditable(false)}
              onSubmit={async (values) => {
                await updateTenant({ id, ...values })
                refreshTenants()
                setEditable(false)
              }}
            />
          </ScrollArea>
        </Tabs.Panel>
        <Tabs.Panel className="panel-with-table" value="users"><TenantUsersPanel tenant={tenant} /></Tabs.Panel>
      </Tabs>
      <BlockNavigation
        when={editable}
        title={t("tenants.unsavedChanges")}
        message={t("tenants.unsavedChangesMessage")}
      />
    </Page>
  )
}
