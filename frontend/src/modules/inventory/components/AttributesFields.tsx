import type { ClassAttribute } from "@/modules/catalogs/types"
import { Loader, NumberInput, Select, SimpleGrid, TextInput, type SimpleGridProps } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useTranslation } from "react-i18next"
import { editableAttributes, formatAttribute, isEmptyAttribute, type AttributeFormValue } from "../attributes"
import type { AttributeValue } from "../types"

type Props = {
  /** The attributes of the class; `undefined` while the class loads. */
  classAttributes: ClassAttribute[] | undefined
  values: Record<string, AttributeFormValue>
  /** The values saved on the element: those the form does not change are shown read-only. */
  saved: Record<string, AttributeValue>
  onChange: (code: string, value: AttributeFormValue) => void
  readonly: boolean
  /** Errors of the form, as `attributes.<code>`. */
  errors: Record<string, React.ReactNode>
  cols: SimpleGridProps["cols"]
}

/**
 * The attributes of the class of an element (EL-3, D-047), each with the input of its type. A saved value of an
 * attribute retired, or no longer in the class, stays read-only: the server keeps it.
 */
export function AttributesFields({ classAttributes, values, saved, onChange, readonly, errors, cols }: Props) {
  const { t } = useTranslation()
  if (!classAttributes) return <Loader size="sm" />

  const editable = editableAttributes(classAttributes)
  const editableCodes = new Set(editable.map((link) => link.attribute_data.code))
  const links = new Map(classAttributes.map((link) => [link.attribute_data.code, link]))
  // Saved values the form does not change: retired attributes, or attributes no longer in the class.
  const kept = Object.entries(saved).filter(([code, value]) => !editableCodes.has(code) && !isEmptyAttribute(value))
  const readonlyProps = { readOnly: readonly, variant: readonly ? "unstyled" : "default" }
  const selectProps = readonly ? { readOnly: true, variant: "unstyled", rightSection: null } : { clearable: true }

  return (
    <SimpleGrid cols={cols}>
      {editable.map((link) => {
        const attribute = link.attribute_data
        const code = attribute.code
        const label = attribute.unit ? `${attribute.name} (${attribute.unit})` : attribute.name
        const common = {
          label,
          withAsterisk: !readonly && link.required,
          error: errors[`attributes.${code}`],
        }
        const value = values[code] ?? null
        switch (attribute.data_type) {
          case "number":
            return (
              <NumberInput
                key={link.id}
                {...common}
                {...readonlyProps}
                hideControls
                value={value === null ? "" : (value as number | string)}
                onChange={(number) => onChange(code, number)}
              />
            )
          case "boolean":
            return (
              <Select
                key={link.id}
                {...common}
                {...selectProps}
                data={[
                  { value: "true", label: t("inventory.attributes.yes") },
                  { value: "false", label: t("inventory.attributes.no") },
                ]}
                value={value === null ? null : String(value)}
                onChange={(choice) => onChange(code, choice === null ? null : choice === "true")}
              />
            )
          case "choice":
            return (
              <Select
                key={link.id}
                {...common}
                {...selectProps}
                // A saved value no longer among the allowed ones stays visible.
                data={[...new Set([...attribute.choices, ...(value === null ? [] : [String(value)])])]}
                value={value === null ? null : String(value)}
                onChange={(choice) => onChange(code, choice)}
              />
            )
          case "date":
            return (
              <DateInput
                key={link.id}
                {...common}
                {...readonlyProps}
                valueFormat="DD/MM/YYYY"
                clearable={!readonly}
                value={value === null ? null : String(value)}
                onChange={(date) => onChange(code, date)}
              />
            )
          default:
            return (
              <TextInput
                key={link.id}
                {...common}
                {...readonlyProps}
                value={value === null ? "" : String(value)}
                onChange={(event) => onChange(code, event.currentTarget.value)}
              />
            )
        }
      })}
      {kept.map(([code, value]) => {
        const attribute = links.get(code)?.attribute_data
        return (
          <TextInput
            key={code}
            label={attribute?.name ?? code}
            description={t(attribute ? "inventory.attributes.retired" : "inventory.attributes.notInClass")}
            readOnly
            variant="unstyled"
            value={formatAttribute(t, value, attribute?.data_type)}
          />
        )
      })}
    </SimpleGrid>
  )
}
