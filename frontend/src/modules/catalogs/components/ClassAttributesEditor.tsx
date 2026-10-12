import { ActionIcon, Badge, Checkbox, Group, Input, Paper, Stack, Text } from "@mantine/core"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import { TbArrowDown, TbArrowUp, TbX } from "react-icons/tb"
import { attributeDefinitionsApi } from "../api/catalogs"
import { enumLabel, type ClassAttributeRow } from "../fields"
import { CatalogSelect } from "./CatalogSelect"

type Props = {
  label: string
  value: ClassAttributeRow[]
  onChange: (rows: ClassAttributeRow[]) => void
  readonly: boolean
  error?: React.ReactNode
}

/**
 * The attributes surveyed on the elements of a class, in their order. A new attribute is chosen among the available
 * ones; one already in the class stays even if it was later hidden or retired.
 */
export function ClassAttributesEditor({ label, value, onChange, readonly, error }: Props) {
  const { t } = useTranslation()
  const labelId = useId()
  const move = (index: number, offset: number) => {
    const rows = [...value]
    const [row] = rows.splice(index, 1)
    rows.splice(index + offset, 0, row)
    onChange(rows)
  }

  return (
    // The label names the group of the rows: it is not the label of one input.
    <Input.Wrapper label={label} labelElement="div" labelProps={{ id: labelId }} error={error}>
      <Stack gap="xs" mt="xxs" role="group" aria-labelledby={labelId}>
        {value.length === 0 && (
          <Text size="sm" c="dimmed">
            {t("catalogs.classAttributes.empty")}
          </Text>
        )}
        {value.map((row, index) => {
          const name = row.attribute_data?.name ?? row.attribute
          const details = row.attribute_data && [
            enumLabel(t, "data_type", row.attribute_data.data_type),
            row.attribute_data.unit,
            row.attribute_data.is_measure ? t("catalogs.classAttributes.measure") : "",
          ]
          return (
            <Paper key={row.attribute} withBorder px="sm" py="xs">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={0}>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {name}
                    </Text>
                    {row.attribute_data?.retired && (
                      <Badge size="xs" color="gray">
                        {t("catalogs.status.retired")}
                      </Badge>
                    )}
                  </Group>
                  {details && (
                    <Text size="xs" c="dimmed">
                      {details.filter(Boolean).join(" · ")}
                    </Text>
                  )}
                </Stack>
                {readonly ? (
                  row.required && <Badge variant="light">{t("catalogs.classAttributes.required")}</Badge>
                ) : (
                  <Group gap="xs" wrap="nowrap">
                    <Checkbox
                      label={t("catalogs.classAttributes.required")}
                      checked={row.required}
                      onChange={(event) =>
                        onChange(
                          value.map((other, otherIndex) =>
                            otherIndex === index ? { ...other, required: event.currentTarget.checked } : other
                          )
                        )
                      }
                    />
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={t("catalogs.classAttributes.moveUp", { name })}
                    >
                      <TbArrowUp />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      disabled={index === value.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={t("catalogs.classAttributes.moveDown", { name })}
                    >
                      <TbArrowDown />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onChange(value.filter((_, otherIndex) => otherIndex !== index))}
                      aria-label={t("catalogs.classAttributes.remove", { name })}
                    >
                      <TbX />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            </Paper>
          )
        })}
        {!readonly && (
          <CatalogSelect
            api={attributeDefinitionsApi}
            aria-label={t("catalogs.classAttributes.add")}
            placeholder={t("catalogs.classAttributes.add")}
            exclude={value.map((row) => row.attribute)}
            value={null}
            onChange={(attribute, choice) => {
              if (attribute && choice) onChange([...value, { attribute, required: false, attribute_data: choice }])
            }}
          />
        )}
      </Stack>
    </Input.Wrapper>
  )
}
