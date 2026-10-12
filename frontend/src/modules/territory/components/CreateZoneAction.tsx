import { useClientChoices } from "@/modules/parties/api/clients"
import { Button } from "@mantine/core"
import { modals } from "@mantine/modals"
import { useTranslation } from "react-i18next"
import { TbPlus } from "react-icons/tb"
import { useCreateZone } from "../api/zones"
import { ZoneForm } from "./ZoneForm"

/** New zone; the form starts from the client of the filter of the list, if it is active. */
export function CreateZoneAction({ client }: { client?: string | null }) {
  const { t } = useTranslation()
  const { mutateAsync: createZone } = useCreateZone()
  const { data: activeClients } = useClientChoices({ active: "true" })
  const defaultClient = activeClients?.some((choice) => choice.id === client) ? client : null

  return (
    <Button
      leftSection={<TbPlus />}
      onClick={() => {
        const modalId = modals.open({
          title: t("territory.newZone"),
          children: (
            <ZoneForm
              defaultClient={defaultClient}
              onSubmit={async (values) => {
                await createZone(values)
                modals.close(modalId)
              }}
            />
          ),
        })
      }}
    >
      {t("territory.newZone")}
    </Button>
  )
}
