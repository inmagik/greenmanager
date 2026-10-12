import { notifyWarnings, type ServerWarning } from "@/components/WarningsAlert"

/**
 * The warnings that only the response of a write gives, as a notification: the trees very close to a new position
 * (D-052). The detail shows the others, such as the element outside its area.
 */
export function notifyPositionWarnings(warnings: ServerWarning[]) {
  notifyWarnings(warnings.filter((warning) => warning.code === "element_near_tree"))
}
