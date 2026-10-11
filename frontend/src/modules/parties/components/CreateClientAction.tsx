import { Button } from "@mantine/core"
import { modals } from "@mantine/modals"
import { useTranslation } from "react-i18next"
import { TbPlus } from "react-icons/tb"
import { useCreateClient } from "../api/clients"
import { ClientForm } from "./ClientForm"

export function CreateClientAction() {
  const { t } = useTranslation()
  const { mutateAsync: createClient } = useCreateClient()

  return (
    <Button
      leftSection={<TbPlus />}
      onClick={() => {
        const modalId = modals.open({
          title: t("parties.newClient"),
          children: (
            <ClientForm
              onSubmit={async (values) => {
                await createClient(values)
                modals.close(modalId)
              }}
            />
          ),
        })
      }}
    >
      {t("parties.newClient")}
    </Button>
  )
}
