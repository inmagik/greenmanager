import { requestConfirmation, translateApiError } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { modals } from "@mantine/modals"
import { TbDots, TbPencil, TbTrash } from "react-icons/tb"
import { useDeleteTenant, useUpdateTenant } from "../api/tenants"
import type { Tenant } from "../types"
import { TenantForm } from "./TenantForm"
import { useTenant } from "@/hooks/useTenant"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { notifications } from "@mantine/notifications"
import { AddTenantUsersMenuItem } from "./ManageTenantUsersAction"
import { useTranslation } from "react-i18next"

export function TenantContextActions({ tenant }: { tenant: Tenant }) {
  const { t } = useTranslation()
  const { mutateAsync: updateTenant } = useUpdateTenant()
  const { mutateAsync: deleteTenant } = useDeleteTenant()
  const { refreshTenants } = useTenant()

  return (
    <Menu>
      <Menu.Target>
        <Button px="xs" variant="subtle" color="gray" c="gray.7" aria-label={t("tenants.actionsFor", { name: tenant.name })}>
          <TbDots size="1.25rem" />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("tenants.actions")}</Menu.Label>
        <AddTenantUsersMenuItem tenant={tenant} />
        <Menu.Item
          leftSection={<TbPencil />}
          onClick={() => {
            const modalId = modals.open({
              title: t("tenants.editTenant", { name: tenant.name }),
              children: (
                <TenantForm
                  initialValues={tenant}
                  onSubmit={async (values) => {
                    await updateTenant({ id: tenant.id, ...values })
                    refreshTenants()
                    modals.close(modalId)
                  }}
                />
              ),
            })
          }}
        >
          {t("tenants.edit")}
        </Menu.Item>
        <Menu.Label>{t("tenants.dangerZone")}</Menu.Label>
        <Menu.Item
          color="red"
          leftSection={<TbTrash />}
          onClick={async () => {
            const confirmed = await requestConfirmation(
              t("tenants.deleteTenant"),
              <b>{t("tenants.deleteTenantHeading", { name: tenant.name })}</b>,
              t("tenants.deleteTenantMessage")
            )
            if (confirmed) {
              try {
                await deleteTenant(tenant.id)
                refreshTenants()
              } catch (error) {
                const detail = translateApiError(
                  error instanceof ApiError ? error.data : null,
                  t("tenants.deleteTenantErrorMessage"),
                )
                notifications.show({ title: t("tenants.deleteTenantError"), message: detail, color: "red" })
              }
            }
          }}
        >
          {t("tenants.deleteTenant")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
