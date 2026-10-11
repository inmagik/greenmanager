import { Loader, Select, type SelectProps } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useClientChoices } from "../api/clients"

type Props = Omit<SelectProps, "data" | "value" | "onChange"> & {
  value: string | null
  onChange: (value: string | null) => void
  /** Only the active clients, to choose the client of new data. A filter shows them all. */
  activeOnly?: boolean
}

/** Choose a client, in a form or as the filter of a list (`useClientFilter`). */
export function ClientSelect({ value, onChange, activeOnly = false, error, ...props }: Props) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useClientChoices(activeOnly ? { active: "true" } : {})
  const options = (data ?? []).map((client) => ({
    value: client.id,
    label: client.active ? client.name : t("parties.select.inactiveOption", { name: client.name }),
  }))

  return (
    <Select
      searchable
      placeholder={t("parties.select.placeholder")}
      aria-label={props.label ? undefined : t("parties.select.label")}
      nothingFoundMessage={t("common.noResults")}
      rightSection={isLoading ? <Loader size="xs" /> : undefined}
      {...props}
      data={options}
      value={value}
      onChange={(newValue) => onChange(newValue)}
      error={error ?? (isError ? t("parties.loadError") : undefined)}
    />
  )
}
