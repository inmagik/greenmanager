import { AlertError } from "@/components/AlertError"
import { apiErrorMessage } from "@/utils"
import { Button, Group, Stack, Text, Textarea } from "@mantine/core"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useRestoreElement } from "../api/elements"
import type { ElementListItem } from "../types"

/** The restoration of an element removed by mistake, with the reason for the history. */
export function RestoreElementForm({ element, onDone }: { element: ElementListItem; onDone: () => void }) {
  const { t } = useTranslation()
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync: restoreElement, isPending } = useRestoreElement()

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        try {
          await restoreElement({ id: element.id, reason: reason.trim() })
          onDone()
        } catch (exc) {
          // The errors are of the element (e.g. `element_replaced`), not of the reason.
          setError(apiErrorMessage(exc))
        }
      }}
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          {t("inventory.restoreDescription")}
        </Text>
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
