import type { ClassAttribute } from "@/modules/catalogs/types"
import dayjs from "dayjs"
import type { TFunction } from "i18next"
import type { AttributeValue } from "./types"

/** A value of an attribute in the form: empty is `null`; a number input gives a text while it is typed. */
export type AttributeFormValue = AttributeValue | null

export function isEmptyAttribute(value: unknown) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
}

/**
 * The attributes of a class that the element form changes, in their order: not the measures, which go in the
 * observations (D-028), nor the retired ones, whose saved values stay as they are (D-047).
 */
export function editableAttributes(classAttributes: ClassAttribute[]): ClassAttribute[] {
  return classAttributes
    .filter((link) => !link.attribute_data.is_measure && !link.attribute_data.retired)
    .sort((a, b) => a.sort_order - b.sort_order)
}

/** The value to send: a number from its text, empty as `null`, which removes it. */
function cleanValue(link: ClassAttribute, value: AttributeFormValue | undefined): AttributeFormValue {
  if (isEmptyAttribute(value)) return null
  if (link.attribute_data.data_type === "number" && typeof value === "string") {
    const number = Number(value)
    return Number.isFinite(number) ? number : value
  }
  return typeof value === "string" ? value.trim() : value!
}

/**
 * The attributes to send, by code: those the form changes, with an empty value as `null`. The others are left out,
 * and the server keeps them.
 */
export function attributesPayload(
  classAttributes: ClassAttribute[],
  values: Record<string, AttributeFormValue>
): Record<string, AttributeFormValue> {
  return Object.fromEntries(
    editableAttributes(classAttributes).map((link) => [
      link.attribute_data.code,
      cleanValue(link, values[link.attribute_data.code]),
    ])
  )
}

/** A saved value as text, in the detail. */
export function formatAttribute(t: TFunction, value: AttributeValue | null | undefined, dataType?: string): string {
  if (isEmptyAttribute(value)) return "—"
  if (typeof value === "boolean") return t(value ? "inventory.attributes.yes" : "inventory.attributes.no")
  if (dataType === "date" && typeof value === "string") return dayjs(value).format("DD/MM/YYYY")
  return String(value)
}
