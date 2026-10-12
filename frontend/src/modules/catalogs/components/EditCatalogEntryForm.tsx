import { AlertError } from "@/components/AlertError"
import { translateApiError } from "@/utils"
import { Group, Loader } from "@mantine/core"
import { useTranslation } from "react-i18next"
import type { CatalogDefinition } from "../definitions"
import { CatalogEntryForm } from "./CatalogEntryForm"

type Props = { catalog: CatalogDefinition; id: string; onSaved: () => void }

/** Edit form in a modal: it loads the current entry, so the revision it sends is the latest one. */
export function EditCatalogEntryForm({ catalog, id, onSaved }: Props) {
  const { t } = useTranslation()
  const { data: entry, error, refetch } = catalog.api.useEntry(id)
  const { mutateAsync: updateEntry } = catalog.api.useUpdateEntry()

  if (error) {
    return <AlertError title={t("common.errorTitle")} message={translateApiError(error, t("common.unexpectedError"))} />
  }
  if (!entry) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    )
  }
  return (
    <CatalogEntryForm
      // A new revision, after a reload, starts the form again with its values.
      key={entry.revision}
      catalog={catalog}
      entry={entry}
      onReload={() => refetch()}
      onSubmit={async (values) => {
        await updateEntry({ id: entry.id, revision: entry.revision, ...values })
        onSaved()
      }}
    />
  )
}
