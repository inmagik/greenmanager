import { Button } from "@mantine/core"
import { modals } from "@mantine/modals"
import { TbBuildingPlus } from "react-icons/tb"
import { useCreateTenant } from "../api/tenants"
import { TenantForm } from "./TenantForm"
import { useTenant } from "@/hooks/useTenant"
import { useTranslation } from "react-i18next"

export function CreateTenantAction() {
  const { t } = useTranslation()
  const { mutateAsync: createTenant } = useCreateTenant()
  const { refreshTenants } = useTenant()

  return (
    <Button
      leftSection={<TbBuildingPlus />}
      onClick={() => {
        const modalId = modals.open({
          title: t("tenants.newTenant"),
          children: (
            <TenantForm
              onSubmit={async (values) => {
                await createTenant(values)
                refreshTenants()
                modals.close(modalId)
              }}
            />
          ),
        })
      }}
    >
      {t("tenants.newTenant")}
    </Button>
  )
}
