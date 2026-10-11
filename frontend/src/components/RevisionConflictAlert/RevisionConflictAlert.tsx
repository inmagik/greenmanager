import { AlertError } from "@/components/AlertError"
import type { AlertProps } from "@mantine/core"
import { useTranslation } from "react-i18next"

type Props = {
  /** Reload the record and show its current values in the form. */
  onReload: () => void
} & Omit<AlertProps, "color" | "title" | "variant">

/** A change refused with `revision_conflict`: the record changed after the form was opened. */
export function RevisionConflictAlert({ onReload, ...props }: Props) {
  const { t } = useTranslation()
  return (
    <AlertError
      variant="warning"
      title={t("revisionConflict.title")}
      message={t("serverErrors.revision_conflict")}
      action={t("revisionConflict.reload")}
      onAction={onReload}
      {...props}
    />
  )
}
