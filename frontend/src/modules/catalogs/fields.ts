import type { TFunction } from "i18next"
import * as yup from "yup"
import type { CatalogDefinition, FieldDefinition } from "./definitions"
import type { CatalogEntry, ClassAttribute, Species } from "./types"

export function fieldLabel(t: TFunction, catalog: CatalogDefinition, name: string): string {
  return t([`catalogs.${catalog.key}.fields.${name}`, `catalogs.fields.${name}`])
}

export function fieldDescription(t: TFunction, name: string): string | undefined {
  const key = `catalogs.fields.${name}Description`
  return t(key, { defaultValue: "" }) || undefined
}

export function enumLabel(t: TFunction, name: string, value: string): string {
  return t(`catalogs.enums.${name}.${value}`, { defaultValue: value })
}

export function speciesLabel(species: Pick<Species, "scientific_name" | "common_name">): string {
  return species.common_name ? `${species.scientific_name} (${species.common_name})` : species.scientific_name
}

/** A value of an entry as text, for the columns of the lists. */
export function formatField(t: TFunction, field: FieldDefinition, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  switch (field.kind) {
    case "enum":
      return enumLabel(t, field.name, String(value))
    case "boolean":
      return t(value ? "catalogs.yes" : "catalogs.no")
    case "list":
      return (value as string[]).join(", ") || "—"
    default:
      return String(value)
  }
}

/** A row of the attributes of a class, in the form. */
export type ClassAttributeRow = Pick<ClassAttribute, "attribute" | "required"> & {
  attribute_data?: ClassAttribute["attribute_data"]
}

/** The value of a field when it has no value, or when it is hidden (`onlyWhen`). */
export function emptyValue(field: FieldDefinition): unknown {
  switch (field.kind) {
    case "boolean":
      return false
    case "list":
    case "classAttributes":
      return []
    case "speciesParent":
      return null
    default:
      return ""
  }
}

/** The values of the form for an entry, or for a new one. */
export function initialValues(catalog: CatalogDefinition, entry?: CatalogEntry): Record<string, unknown> {
  const record = (entry ?? {}) as Record<string, unknown>
  const values: Record<string, unknown> = {
    [catalog.nameField]: record[catalog.nameField] ?? "",
    code: entry?.code ?? "",
    description: entry?.description ?? "",
    sort_order: entry?.sort_order ?? 0,
    source: entry?.source ?? "",
  }
  for (const field of catalog.fields) {
    if (field.kind === "classAttributes") {
      values[field.name] = ((record[field.name] as ClassAttribute[] | undefined) ?? []).map(
        ({ attribute, required, attribute_data }) => ({ attribute, required, attribute_data })
      )
    } else if (field.kind === "number") {
      values[field.name] = record[field.name] ?? field.min ?? 0
    } else if (field.kind === "enum") {
      values[field.name] = record[field.name] ?? field.initial ?? ""
    } else {
      values[field.name] = record[field.name] ?? emptyValue(field)
    }
  }
  return values
}

/** The values to send: hidden fields have their empty value, derived ones stay out. */
export function payload(catalog: CatalogDefinition, values: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {
    [catalog.nameField]: values[catalog.nameField],
    code: values.code,
    description: values.description,
    sort_order: values.sort_order,
    source: values.source,
  }
  for (const field of catalog.fields) {
    if (field.derived) continue
    if (field.onlyWhen && !field.onlyWhen(values)) {
      data[field.name] = emptyValue(field)
    } else if (field.kind === "classAttributes") {
      // The order of the list is the order of the attributes.
      data[field.name] = (values[field.name] as ClassAttributeRow[]).map(({ attribute, required }) => ({
        attribute,
        required,
      }))
    } else {
      data[field.name] = values[field.name]
    }
  }
  return data
}

export function validationSchema(t: TFunction, catalog: CatalogDefinition) {
  const shape: Record<string, yup.AnySchema> = {
    [catalog.nameField]: yup
      .string()
      .trim()
      .required()
      .max(255)
      .label(fieldLabel(t, catalog, catalog.nameField)),
    code: yup.string().trim().max(150).label(t("catalogs.fields.code")),
    sort_order: yup
      .number()
      .typeError(t("validation.invalid", { field: t("catalogs.fields.sort_order") }))
      .integer()
      .label(t("catalogs.fields.sort_order")),
    source: yup.string().trim().max(255).label(t("catalogs.fields.source")),
  }
  for (const field of catalog.fields) {
    if (field.derived) continue
    const label = fieldLabel(t, catalog, field.name)
    if (field.kind === "enum" && field.required) {
      shape[field.name] = yup.string().required().label(label)
    } else if (field.kind === "number") {
      let schema = yup
        .number()
        .typeError(t("validation.invalid", { field: label }))
        .integer()
        .label(label)
      if (field.min !== undefined) schema = schema.min(field.min)
      shape[field.name] = field.required ? schema.required() : schema
    } else if (field.kind === "text" && field.maxLength) {
      shape[field.name] = yup.string().trim().max(field.maxLength).label(label)
    }
  }
  return yup.object(shape)
}
