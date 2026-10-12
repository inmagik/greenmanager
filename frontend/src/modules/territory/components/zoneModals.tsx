import { AuditHistoryModal } from "@/components/AuditHistoryModal"
import { modals } from "@mantine/modals"
import type { TFunction } from "i18next"
import { zoneHistoryEndpoint } from "../api/zones"
import type { Zone } from "../types"
import { EditZoneForm } from "./EditZoneForm"

// The modals render outside the router: their content cannot use links or navigation.

export function zoneLabel(zone: Pick<Zone, "code" | "name">) {
  return `${zone.code} ${zone.name}`
}

export function openZoneEdit(zone: Zone, t: TFunction) {
  const modalId = modals.open({
    title: t("territory.editZone", { name: zoneLabel(zone) }),
    children: <EditZoneForm id={zone.id} onSaved={() => modals.close(modalId)} />,
  })
}

/** The technical history of the zone (django-auditlog, action `history/`). */
export function openZoneHistory(zone: Zone, t: TFunction) {
  modals.open({
    title: `${t("history.title")}: ${zoneLabel(zone)}`,
    size: "lg",
    children: <AuditHistoryModal endpoint={zoneHistoryEndpoint(zone.id)} />,
  })
}
