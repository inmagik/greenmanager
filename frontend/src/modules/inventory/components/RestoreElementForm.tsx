import { AlertError } from "@/components/AlertError"
import { RevisionConflictAlert } from "@/components/RevisionConflictAlert"
import { apiErrorMessage, translateApiError } from "@/utils"
import { isRevisionConflict } from "@/utils/tracking"
import { Button, Group, Loader, Stack, Text, Textarea } from "@mantine/core"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useElement, useRestoreElement } from "../api/elements"
import type { Element } from "../types"

type Props = {
  element: Element
  onDone: () => void
  /** Reload the element after a revision conflict; the parent remounts the form with the new revision. */
  onReload: () => void
}

function RestoreForm({ element, onDone, onReload }: Props) {
  const { t } = useTranslation()
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const { mutateAsync: restoreElement, isPending } = useRestoreElement()

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        try {
          await restoreElement({ id: element.id, revision: element.revision, reason: reason.trim() })
          onDone()
        } catch (exc) {
          // The errors are of the element (e.g. `element_replaced`), not of the reason.
          if (isRevisionConflict(exc)) setConflict(true)
          else setError(apiErrorMessage(exc))
        }
      }}
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          {t("inventory.restoreDescription")}
        </Text>
        {conflict && <RevisionConflictAlert onReload={onReload} />}
        {error && <AlertError title={t("inventory.restoreError")} message={error} />}
        <Textarea
          label={t("inventory.fields.reason")}
          description={t("inventory.fields.reasonDescription")}
          autosize
          minRows={2}
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value)}
        />
        <Group justify="flex-end" pt="sm">
          <Button type="submit" loading={isPending}>
            {t("inventory.restore")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

/**
 * The restoration of an element removed by mistake, with the reason for the history. It loads the current element and
 * sends its revision, like the removal.
 */
export function RestoreElementForm({ id, onDone }: { id: string; onDone: () => void }) {
  const { t } = useTranslation()
  const { data: element, error, refetch } = useElement(id)

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
  return <RestoreForm key={element.revision} element={element} onDone={onDone} onReload={() => refetch()} />
}
