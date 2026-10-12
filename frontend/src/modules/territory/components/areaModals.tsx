import { AuditHistoryModal } from "@/components/AuditHistoryModal"
import { modals } from "@mantine/modals"
import type { TFunction } from "i18next"
import { areaHistoryEndpoint } from "../api/areas"
import type { AreaListItem } from "../types"
import { EditAreaForm } from "./EditAreaForm"

// The modals render outside the router: their content cannot use links or navigation.

export function areaLabel(area: Pick<AreaListItem, "code" | "name">) {
  return `${area.code} ${area.name}`
}

export function openAreaEdit(area: AreaListItem, t: TFunction) {
  const modalId = modals.open({
    title: t("territory.editArea", { name: areaLabel(area) }),
    size: "xl",
    children: <EditAreaForm id={area.id} onSaved={() => modals.close(modalId)} />,
  })
}

/** The technical history of the area (django-auditlog, action `history/`): the geometry shows as its measures. */
export function openAreaHistory(area: AreaListItem, t: TFunction) {
  modals.open({
    title: `${t("history.title")}: ${areaLabel(area)}`,
    size: "lg",
    children: <AuditHistoryModal endpoint={areaHistoryEndpoint(area.id)} />,
  })
}
