import { AuditHistoryModal } from "@/components/AuditHistoryModal"
import { modals } from "@mantine/modals"
import type { TFunction } from "i18next"
import type { CatalogDefinition } from "../definitions"
import type { CatalogEntry } from "../types"
import { CatalogEntryForm } from "./CatalogEntryForm"
import { EditCatalogEntryForm } from "./EditCatalogEntryForm"

// The modals render outside the router: their content cannot use links or navigation.

export function openEntryCreate(
  catalog: CatalogDefinition,
  onSubmit: (values: Record<string, unknown>) => Promise<unknown>,
  t: TFunction
) {
  const modalId = modals.open({
    title: t("catalogs.newEntry"),
    size: catalog.fields.some((field) => field.wide) ? "lg" : undefined,
    children: (
      <CatalogEntryForm
        catalog={catalog}
        onSubmit={async (values) => {
          await onSubmit(values)
          modals.close(modalId)
        }}
      />
    ),
  })
}

export function openEntryEdit(catalog: CatalogDefinition, entry: CatalogEntry, t: TFunction) {
  const modalId = modals.open({
    title: t("catalogs.editEntry", { name: entry.name }),
    size: catalog.fields.some((field) => field.wide) ? "lg" : undefined,
    children: <EditCatalogEntryForm catalog={catalog} id={entry.id} onSaved={() => modals.close(modalId)} />,
  })
}

/** The technical history of the entry (django-auditlog, action `history/`). */
export function openEntryHistory(catalog: CatalogDefinition, entry: CatalogEntry, t: TFunction) {
  modals.open({
    title: `${t("history.title")}: ${entry.name}`,
    size: "lg",
    children: <AuditHistoryModal endpoint={catalog.api.historyEndpoint(entry.id)} />,
  })
}
