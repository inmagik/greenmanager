import { useClientChoices } from "@/modules/parties/api/clients"
import { Button, type ButtonProps } from "@mantine/core"
import { modals } from "@mantine/modals"
import { useTranslation } from "react-i18next"
import { TbPlus } from "react-icons/tb"
import { useNavigate } from "react-router-dom"
import { useCreateElement } from "../api/elements"
import { ElementForm } from "./ElementForm"
import { notifyPositionWarnings } from "./elementWarnings"

type Props = {
  /** The client of the new element, e.g. the one of the filter of the list, if it is active. */
  client?: string | null
  /** The area of the new element, e.g. in the detail of the area. */
  area?: string | null
} & Omit<ButtonProps, "onClick" | "leftSection">

/**
 * New element, with its position; the form starts from the client of the filter of the list, or from the area. The
 * new element opens in its detail, which shows the warnings about its area; those about the trees close to it are a
 * notification.
 */
export function CreateElementAction({ client, area, ...props }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { mutateAsync: createElement } = useCreateElement()
  const { data: activeClients } = useClientChoices({ active: "true" })
  const defaultClient = activeClients?.some((choice) => choice.id === client) ? client : null

  return (
    <Button
      leftSection={<TbPlus />}
      {...props}
      onClick={() => {
        const modalId = modals.open({
          title: t("inventory.newElement"),
          size: "xl",
          children: (
            <ElementForm
              defaultClient={defaultClient}
              defaultArea={defaultClient ? area : null}
              onSubmit={async (values) => {
                const element = await createElement(values)
                modals.close(modalId)
                navigate(`/inventory/elements/${element.id}`)
                notifyPositionWarnings(element.warnings)
              }}
            />
          ),
        })
      }}
    >
      {t("inventory.newElement")}
    </Button>
  )
}
