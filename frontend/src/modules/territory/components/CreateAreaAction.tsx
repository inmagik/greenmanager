import { useClientChoices } from "@/modules/parties/api/clients"
import { Button } from "@mantine/core"
import { modals } from "@mantine/modals"
import { useTranslation } from "react-i18next"
import { TbPlus } from "react-icons/tb"
import { useNavigate } from "react-router-dom"
import { useCreateArea } from "../api/areas"
import { AreaForm } from "./AreaForm"

/**
 * New area, with its geometry from a file; the form starts from the client of the filter of the list, if it is
 * active. The new area opens in its detail, with the warnings of the server.
 */
export function CreateAreaAction({ client }: { client?: string | null }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { mutateAsync: createArea } = useCreateArea()
  const { data: activeClients } = useClientChoices({ active: "true" })
  const defaultClient = activeClients?.some((choice) => choice.id === client) ? client : null

  return (
    <Button
      leftSection={<TbPlus />}
      onClick={() => {
        const modalId = modals.open({
          title: t("territory.newArea"),
          size: "xl",
          children: (
            <AreaForm
              defaultClient={defaultClient}
              onSubmit={async (values) => {
                const area = await createArea(values)
                modals.close(modalId)
                navigate(`/territory/areas/${area.id}`)
              }}
            />
          ),
        })
      }}
    >
      {t("territory.newArea")}
    </Button>
  )
}
