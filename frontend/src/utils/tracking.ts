import i18n from "@/i18n"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import dayjs from "dayjs"

/** Tracking fields of the domain records (TrackedModelSerializer of the server, D-042). */
export type TrackedRecord = {
  created_at: string
  created_by_label: string | null
  updated_at: string
  updated_by_label: string | null
  revision: number
}

/** Who created and last changed the record, and its revision: the "last change" of the detail header. */
export function lastEditDetails(record: TrackedRecord): string {
  const author = (label: string | null) => label || i18n.t("tracking.system")
  const date = (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm")
  return [
    i18n.t("tracking.created", { date: date(record.created_at), author: author(record.created_by_label) }),
    i18n.t("tracking.updated", { date: date(record.updated_at), author: author(record.updated_by_label) }),
    i18n.t("tracking.revision", { revision: record.revision }),
  ].join(" ")
}

/** Whether a change was refused because the record changed in the meantime (409 `revision_conflict`). */
export function isRevisionConflict(error: unknown): boolean {
  return error instanceof ApiError && error.response.status === 409 && error.data?.code === "revision_conflict"
}
