import { AuditHistoryModal } from "@/components/AuditHistoryModal"
import { modals } from "@mantine/modals"
import type { TFunction } from "i18next"
import { clientHistoryEndpoint } from "../api/clients"
import type { Client } from "../types"
import { EditClientForm } from "./EditClientForm"

// The modals render outside the router: their content cannot use links or navigation.

export function openClientEdit(client: Client, t: TFunction) {
  const modalId = modals.open({
    title: t("parties.editClient", { name: client.name }),
    children: <EditClientForm id={client.id} onSaved={() => modals.close(modalId)} />,
  })
}

/** The technical history of the client (django-auditlog, action `history/`). */
export function openClientHistory(client: Client, t: TFunction) {
  modals.open({
    title: `${t("history.title")}: ${client.name}`,
    size: "lg",
    children: <AuditHistoryModal endpoint={clientHistoryEndpoint(client.id)} />,
  })
}
