import { Loader, Select, type SelectProps } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useZoneChoices } from "../api/zones"
import { zoneLabel } from "./zoneModals"

type Props = Omit<SelectProps, "data" | "value" | "onChange"> & {
  /** The zones are those of the client: without a client, the select is disabled. */
  client: string | null | undefined
  value: string | null
  onChange: (value: string | null) => void
}

/** Choose a zone of a client, in the form of an area or as a filter of the areas. */
export function ZoneSelect({ client, value, onChange, error, disabled, ...props }: Props) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useZoneChoices(client)
  const options = (data ?? []).map((zone) => ({ value: zone.id, label: zoneLabel(zone) }))

  return (
    <Select
      searchable
      clearable
      placeholder={t(client ? "territory.zoneSelect.placeholder" : "territory.zoneSelect.noClient")}
      aria-label={props.label ? undefined : t("territory.zoneSelect.label")}
      nothingFoundMessage={t("territory.zoneSelect.nothingFound")}
      rightSection={isLoading && !!client ? <Loader size="xs" /> : undefined}
      {...props}
      disabled={disabled || !client}
      data={options}
      value={value}
      onChange={(newValue) => onChange(newValue)}
      error={error ?? (isError ? t("territory.zoneLoadError") : undefined)}
    />
  )
}
