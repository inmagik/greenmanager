import { AlertError } from "@/components/AlertError"
import { translateApiError } from "@/utils"
import { Group, Loader } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useClient, useUpdateClient } from "../api/clients"
import { ClientForm } from "./ClientForm"

/** Edit form in a modal: it loads the current client, so the revision it sends is the latest one. */
export function EditClientForm({ id, onSaved }: { id: string; onSaved: () => void }) {
  const { t } = useTranslation()
  const { data: client, error, refetch } = useClient(id)
  const { mutateAsync: updateClient } = useUpdateClient()

  if (error) {
    return <AlertError title={t("common.errorTitle")} message={translateApiError(error, t("common.unexpectedError"))} />
  }
  if (!client) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    )
  }
  return (
    <ClientForm
      // A new revision, after a reload, starts the form again with its values.
      key={client.revision}
      initialValues={client}
      onReload={() => refetch()}
      onSubmit={async (values) => {
        await updateClient({ id: client.id, revision: client.revision, ...values })
        onSaved()
      }}
    />
  )
}
