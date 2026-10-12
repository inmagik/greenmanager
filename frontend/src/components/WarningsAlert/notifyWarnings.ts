import i18n from "@/i18n"
import { translateApiError } from "@/utils"
import { notifications } from "@mantine/notifications"
import type { ServerWarning } from "./WarningsAlert"

/** The `warnings` of a save, as a notification: where the form closes (a modal), and `WarningsAlert` is not seen. */
export function notifyWarnings(warnings: ServerWarning[]) {
  if (!warnings.length) return
  notifications.show({
    color: "yellow",
    title: i18n.t("warnings.title", { count: warnings.length }),
    message: warnings.map((warning) => translateApiError(warning, warning.detail)).join(" "),
    autoClose: 10000,
  })
}
