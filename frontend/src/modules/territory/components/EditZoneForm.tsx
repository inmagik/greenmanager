import { AlertError } from "@/components/AlertError"
import { translateApiError } from "@/utils"
import { Group, Loader } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useUpdateZone, useZone } from "../api/zones"
import { ZoneForm } from "./ZoneForm"

/** Edit form in a modal: it loads the current zone, so the revision it sends is the latest one. */
export function EditZoneForm({ id, onSaved }: { id: string; onSaved: () => void }) {
  const { t } = useTranslation()
  const { data: zone, error, refetch } = useZone(id)
  const { mutateAsync: updateZone } = useUpdateZone()

  if (error) {
    return <AlertError title={t("common.errorTitle")} message={translateApiError(error, t("common.unexpectedError"))} />
  }
  if (!zone) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    )
  }
  return (
    <ZoneForm
      // A new revision, after a reload, starts the form again with its values.
      key={zone.revision}
      zone={zone}
      onReload={() => refetch()}
      onSubmit={async (values) => {
        await updateZone({ id: zone.id, revision: zone.revision, ...values })
        onSaved()
      }}
    />
  )
}
