import { Checkbox, NumberInput, Select, TagsInput, TextInput } from "@mantine/core"
import type { UseFormReturnType } from "@mantine/form"
import { useTranslation } from "react-i18next"
import type { CatalogDefinition, FieldDefinition } from "../definitions"
import { enumLabel, fieldDescription, fieldLabel, type ClassAttributeRow } from "../fields"
import type { CatalogEntry, Species, SpeciesRank } from "../types"
import { ClassAttributesEditor } from "./ClassAttributesEditor"
import { SpeciesSelect } from "./SpeciesSelect"

const SPECIES_PARENT_RANKS: SpeciesRank[] = ["genus"]
const CULTIVAR_PARENT_RANKS: SpeciesRank[] = ["genus", "species", "hybrid"]

type Props = {
  catalog: CatalogDefinition
  field: FieldDefinition
  form: UseFormReturnType<Record<string, unknown>>
  /** The entry shown or changed; none for a new entry. */
  entry?: CatalogEntry
  readonly: boolean
}

/** A field of a catalog in its form, as its definition says. Fields locked because the entry is in use are disabled. */
export function CatalogFieldInput({ catalog, field, form, entry, readonly }: Props) {
  const { t } = useTranslation()
  if (field.derived && !entry) return null
  if (field.onlyWhen && !field.onlyWhen(form.values)) return null

  const label = fieldLabel(t, catalog, field.name)
  const locked = !readonly && !!entry?.locked_fields.includes(field.name)
  const props = {
    label,
    description: readonly ? undefined : locked ? t("catalogs.lockedInUse") : fieldDescription(t, field.name),
    withAsterisk: !readonly && field.required,
    readOnly: readonly || field.derived,
    disabled: locked,
    variant: readonly || field.derived ? "unstyled" : "default",
  }

  switch (field.kind) {
    case "enum":
      return (
        <Select
          {...props}
          placeholder={readonly ? undefined : t("common.selectField", { field: label })}
          data={field.options.map((value) => ({ value, label: enumLabel(t, field.name, value) }))}
          rightSection={readonly ? null : undefined}
          allowDeselect={!field.required}
          {...form.getInputProps(field.name)}
        />
      )
    case "number":
      return <NumberInput {...props} allowDecimal={false} min={field.min} {...form.getInputProps(field.name)} />
    case "text":
      return <TextInput {...props} {...form.getInputProps(field.name)} />
    case "boolean":
      return (
        <Checkbox
          label={label}
          description={props.description}
          readOnly={readonly}
          disabled={locked}
          mt="md"
          {...form.getInputProps(field.name, { type: "checkbox" })}
        />
      )
    case "list":
      return <TagsInput {...props} {...form.getInputProps(field.name)} />
    case "speciesParent": {
      if (readonly) {
        const parent = (entry as Species | undefined)?.parent_data
        return <TextInput {...props} value={parent?.name ?? "—"} />
      }
      // A species or a hybrid has a genus as parent; a cultivar a genus, a species or a hybrid.
      const ranks = form.values.rank === "cultivar" ? CULTIVAR_PARENT_RANKS : SPECIES_PARENT_RANKS
      const { value, onChange, error } = form.getInputProps(field.name)
      return (
        <SpeciesSelect
          label={label}
          description={props.description}
          ranks={ranks}
          value={value}
          onChange={onChange}
          error={error}
        />
      )
    }
    case "classAttributes":
      return (
        <ClassAttributesEditor
          label={label}
          readonly={readonly}
          value={form.values[field.name] as ClassAttributeRow[]}
          onChange={(rows) => form.setFieldValue(field.name, rows)}
          error={form.errors[field.name]}
        />
      )
  }
}
