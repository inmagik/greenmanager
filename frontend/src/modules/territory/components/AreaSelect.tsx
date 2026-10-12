import { Loader, Select, type SelectProps } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useAreaChoices } from "../api/areas"
import { areaLabel } from "./areaModals"

type Props = Omit<SelectProps, "data" | "value" | "onChange"> & {
  /** The areas are those of the client: without a client, the select is disabled. */
  client: string | null | undefined
  /** Only the areas of the zone, e.g. in the filters of a list. */
  zone?: string | null
  value: string | null
  onChange: (value: string | null) => void
}

/** Choose an area of a client, in the form of an element or as a filter of the elements. */
export function AreaSelect({ client, zone, value, onChange, error, disabled, ...props }: Props) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useAreaChoices(client, zone)
  const options = (data ?? []).map((area) => ({ value: area.id, label: areaLabel(area) }))

  return (
    <Select
      searchable
      clearable
      placeholder={t(client ? "territory.areaSelect.placeholder" : "territory.areaSelect.noClient")}
      aria-label={props.label ? undefined : t("territory.areaSelect.label")}
      nothingFoundMessage={t("territory.areaSelect.nothingFound")}
      rightSection={isLoading && !!client ? <Loader size="xs" /> : undefined}
      {...props}
      disabled={disabled || !client}
      data={options}
      value={value}
      onChange={(newValue) => onChange(newValue)}
      error={error ?? (isError ? t("territory.areaLoadError") : undefined)}
    />
  )
}
