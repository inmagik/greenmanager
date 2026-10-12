import { Box, Checkbox, NumberInput, SimpleGrid, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { yupResolver } from "mantine-form-yup-resolver"
import { useTranslation } from "react-i18next"
import type { CatalogDefinition } from "../definitions"
import { fieldDescription, fieldLabel, initialValues, payload, validationSchema } from "../fields"
import { useCatalogPermissions } from "../hooks/useCatalogPermissions"
import type { CatalogEntry } from "../types"
import { CatalogFieldInput } from "./CatalogFieldInput"
import { EntryFormShell } from "./EntryFormShell"

export type CatalogEntryFormProps = {
  catalog: CatalogDefinition
  /** The entry to show or change; none for a new entry. */
  entry?: CatalogEntry
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void
  /** Reload the entry after a revision conflict; the parent remounts the form with the new values. */
  onReload?: () => void
  readonly?: boolean
  layout?: "modal" | "page"
  onCancel?: () => void
}

/**
 * The form of an entry of any catalog: the name, the fields of the catalog (its definition), the common fields.
 *
 * - The code of a system entry does not change; fields locked because the entry is in use are disabled.
 * - A staff user chooses whether a new entry is a system entry; in the catalogs without entries of the organizations
 *   every new entry is a system entry.
 */
export function CatalogEntryForm({
  catalog,
  entry,
  onSubmit,
  onReload,
  readonly = false,
  layout = "modal",
  onCancel,
}: CatalogEntryFormProps) {
  const { t } = useTranslation()
  const { isStaff } = useCatalogPermissions(catalog)
  const systemChoice = !entry && isStaff && catalog.extensible && catalog.organizationEntries
  const form = useForm<Record<string, unknown>>({
    mode: "controlled",
    initialValues: { ...initialValues(catalog, entry), ...(systemChoice ? { is_system: false } : {}) },
    validate: yupResolver(validationSchema(t, catalog)),
  })
  const variant = readonly ? "unstyled" : "default"
  const codeLocked = !readonly && !!entry?.is_system
  const nameLabel = fieldLabel(t, catalog, catalog.nameField)
  const fieldInput = (field: CatalogDefinition["fields"][number]) => (
    <CatalogFieldInput key={field.name} catalog={catalog} field={field} form={form} entry={entry} readonly={readonly} />
  )

  return (
    <EntryFormShell
      form={form}
      readonly={readonly}
      layout={layout}
      onReload={onReload}
      onCancel={onCancel}
      onSubmit={async (values) => {
        const data = payload(catalog, values)
        if (!entry && catalog.extensible && (!catalog.organizationEntries || values.is_system)) data.is_system = true
        await onSubmit(data)
      }}
    >
      <SimpleGrid cols={layout === "page" ? { base: 1, md: 2, lg: 3 } : 1}>
        <TextInput
          withAsterisk={!readonly}
          label={nameLabel}
          readOnly={readonly}
          variant={variant}
          {...form.getInputProps(catalog.nameField)}
        />
        {catalog.fields.filter((field) => !field.wide).map(fieldInput)}
        <TextInput
          label={t("catalogs.fields.code")}
          description={
            readonly ? undefined : codeLocked ? t("serverErrors.catalog_code_immutable") : fieldDescription(t, "code")
          }
          readOnly={readonly}
          disabled={codeLocked}
          variant={variant}
          {...form.getInputProps("code")}
        />
        <NumberInput
          label={t("catalogs.fields.sort_order")}
          description={readonly ? undefined : fieldDescription(t, "sort_order")}
          allowDecimal={false}
          readOnly={readonly}
          variant={variant}
          {...form.getInputProps("sort_order")}
        />
        <TextInput
          label={t("catalogs.fields.source")}
          readOnly={readonly}
          variant={variant}
          {...form.getInputProps("source")}
        />
        <Textarea
          label={t("catalogs.fields.description")}
          autosize
          minRows={2}
          readOnly={readonly}
          variant={variant}
          {...form.getInputProps("description")}
        />
        {systemChoice && (
          <Checkbox
            label={t("catalogs.fields.is_system")}
            description={fieldDescription(t, "is_system")}
            mt="md"
            {...form.getInputProps("is_system", { type: "checkbox" })}
          />
        )}
      </SimpleGrid>
      {catalog.fields
        .filter((field) => field.wide)
        .map((field) => (
          <Box key={field.name} mt="md">
            {fieldInput(field)}
          </Box>
        ))}
    </EntryFormShell>
  )
}
