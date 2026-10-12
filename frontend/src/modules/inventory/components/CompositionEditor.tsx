import { SpeciesSelect } from "@/modules/catalogs/components/SpeciesSelect"
import { speciesLabel } from "@/modules/catalogs/fields"
import { ActionIcon, Button, Group, Input, List, NumberInput, Stack, Text } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbPlus, TbX } from "react-icons/tb"
import { totalPercentage, compositionRow, type CompositionRow } from "../composition"

type Props = {
  label: string
  value: CompositionRow[]
  onChange: (rows: CompositionRow[]) => void
  readonly: boolean
  /** Errors of the form: `composition` for the whole list, `composition.<index>.<field>` for a row. */
  errors: Record<string, React.ReactNode>
}

/** The species of a group element, each with its number of individuals or its percentage (EL-5). */
export function CompositionEditor({ label, value, onChange, readonly, errors }: Props) {
  const { t } = useTranslation()
  const update = (index: number, row: Partial<CompositionRow>) =>
    onChange(value.map((current, position) => (position === index ? { ...current, ...row } : current)))
  const total = totalPercentage(value)

  if (readonly) {
    return (
      <Input.Wrapper label={label}>
        {value.length ? (
          <List size="sm" mt={4}>
            {value.map((row) => (
              <List.Item key={row.key}>
                {row.species_data ? speciesLabel(row.species_data) : "—"}
                {": "}
                {[
                  row.quantity !== "" && t("inventory.composition.quantityValue", { count: Number(row.quantity) }),
                  row.percentage !== "" && t("inventory.composition.percentageValue", { value: row.percentage }),
                ]
                  .filter(Boolean)
                  .join(", ")}
              </List.Item>
            ))}
          </List>
        ) : (
          <Text size="sm" c="dimmed" mt={4}>
            {t("inventory.composition.empty")}
          </Text>
        )}
      </Input.Wrapper>
    )
  }

  return (
    <Input.Wrapper label={label} error={errors.composition}>
      <Stack gap="xs" mt={4}>
        {value.map((row, index) => (
          <Group key={row.key} gap="xs" align="flex-start" wrap="wrap">
            <div style={{ flex: "1 1 240px" }}>
              <SpeciesSelect
                value={row.species}
                onChange={(species) => update(index, { species })}
                error={errors[`composition.${index}.species`]}
              />
            </div>
            <NumberInput
              w={110}
              placeholder={t("inventory.composition.quantity")}
              aria-label={t("inventory.composition.quantity")}
              allowDecimal={false}
              min={1}
              value={row.quantity}
              onChange={(quantity) => update(index, { quantity })}
              error={errors[`composition.${index}.quantity`]}
            />
            <NumberInput
              w={120}
              placeholder={t("inventory.composition.percentage")}
              aria-label={t("inventory.composition.percentage")}
              decimalScale={2}
              min={0.01}
              max={100}
              suffix="%"
              value={row.percentage}
              onChange={(percentage) => update(index, { percentage })}
              error={errors[`composition.${index}.percentage`]}
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label={t("inventory.composition.remove")}
              onClick={() => onChange(value.filter((_, position) => position !== index))}
            >
              <TbX />
            </ActionIcon>
          </Group>
        ))}
        <Group justify="space-between">
          <Button
            variant="subtle"
            size="xs"
            leftSection={<TbPlus />}
            onClick={() => onChange([...value, compositionRow()])}
          >
            {t("inventory.composition.add")}
          </Button>
          {total > 0 && (
            <Text size="xs" c={total > 100 ? "red" : "dimmed"}>
              {t("inventory.composition.total", { total: Math.round(total * 100) / 100 })}
            </Text>
          )}
        </Group>
      </Stack>
    </Input.Wrapper>
  )
}
