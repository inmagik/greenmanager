import { AuditHistoryModal } from "@/components/AuditHistoryModal"
import { modals } from "@mantine/modals"
import type { TFunction } from "i18next"
import { elementHistoryEndpoint } from "../api/elements"
import { elementLabel } from "../labels"
import type { ElementListItem } from "../types"
import { EditElementForm } from "./EditElementForm"
import { RemoveElementForm } from "./RemoveElementForm"
import { RestoreElementForm } from "./RestoreElementForm"

// The modals render outside the router: their content cannot use links or navigation.

export function openElementEdit(element: ElementListItem, t: TFunction) {
  const modalId = modals.open({
    title: t("inventory.editElement", { name: elementLabel(element) }),
    size: "xl",
    children: <EditElementForm id={element.id} onSaved={() => modals.close(modalId)} />,
  })
}

/** The technical history of the element (django-auditlog, action `history/`): the geometry shows as its measures. */
export function openElementHistory(element: ElementListItem, t: TFunction) {
  modals.open({
    title: `${t("history.title")}: ${elementLabel(element)}`,
    size: "lg",
    children: <AuditHistoryModal endpoint={elementHistoryEndpoint(element.id)} />,
  })
}

/** Remove the element or, if it is removed, correct date and cause of the removal. */
export function openElementRemoval(element: ElementListItem, t: TFunction) {
  const name = elementLabel(element)
  const modalId = modals.open({
    title: t(element.removed_on ? "inventory.correctRemovalTitle" : "inventory.removeTitle", { name }),
    children: <RemoveElementForm id={element.id} onDone={() => modals.close(modalId)} />,
  })
}

export function openElementRestore(element: ElementListItem, t: TFunction) {
  const modalId = modals.open({
    title: t("inventory.restoreTitle", { name: elementLabel(element) }),
    children: <RestoreElementForm id={element.id} onDone={() => modals.close(modalId)} />,
  })
}
