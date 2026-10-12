import { AlertError } from "@/components/AlertError"
import { notifyWarnings } from "@/components/WarningsAlert"
import { translateApiError } from "@/utils"
import { Group, Loader } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useElement, useUpdateElement } from "../api/elements"
import { ElementForm } from "./ElementForm"

/**
 * Edit form in a modal: it loads the current element, so the revision it sends is the latest one. The warnings of the
 * save are a notification.
 */
export function EditElementForm({ id, onSaved }: { id: string; onSaved: () => void }) {
  const { t } = useTranslation()
  const { data: element, error, refetch } = useElement(id)
  const { mutateAsync: updateElement } = useUpdateElement()

  if (error) {
    return <AlertError title={t("common.errorTitle")} message={translateApiError(error, t("common.unexpectedError"))} />
  }
  if (!element) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    )
  }
  return (
    <ElementForm
      // A new revision, after a reload, starts the form again with its values.
      key={element.revision}
      element={element}
      onReload={() => refetch()}
      onSubmit={async (values) => {
        const saved = await updateElement({ id: element.id, revision: element.revision, ...values })
        onSaved()
        // The modal closes: the warnings of the new values go in a notification.
        notifyWarnings(saved.warnings)
      }}
    />
  )
}
