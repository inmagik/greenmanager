import { AlertError } from "@/components/AlertError"
import { translateApiError } from "@/utils"
import { Group, Loader } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useArea, useUpdateArea } from "../api/areas"
import { AreaForm } from "./AreaForm"

/** Edit form in a modal: it loads the current area, so the revision it sends is the latest one. */
export function EditAreaForm({ id, onSaved }: { id: string; onSaved: () => void }) {
  const { t } = useTranslation()
  const { data: area, error, refetch } = useArea(id)
  const { mutateAsync: updateArea } = useUpdateArea()

  if (error) {
    return <AlertError title={t("common.errorTitle")} message={translateApiError(error, t("common.unexpectedError"))} />
  }
  if (!area) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    )
  }
  return (
    <AreaForm
      // A new revision, after a reload, starts the form again with its values.
      key={area.revision}
      area={area}
      onReload={() => refetch()}
      onSubmit={async (values) => {
        await updateArea({ id: area.id, revision: area.revision, ...values })
        onSaved()
      }}
    />
  )
}
