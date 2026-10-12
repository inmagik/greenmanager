import type { ElementListItem } from "./types"

export function elementLabel(element: Pick<ElementListItem, "code" | "element_class_data">) {
  return `${element.code} ${element.element_class_data.name}`
}
