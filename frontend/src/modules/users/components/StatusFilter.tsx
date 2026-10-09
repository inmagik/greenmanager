import { Select, type SelectProps } from "@mantine/core"
import { TbChevronDown } from "react-icons/tb"
import { useTranslation } from "react-i18next"

type Props = Omit<SelectProps, "data" | "value" | "onChange" | "searchable" | "searchValue" | "onSearchChange"> & {
  value: string | null
  onChange: (value: string | null) => void
}

export function StatusFilter({ value, onChange, ...props }: Props) {
  const { t } = useTranslation()
  const options = [
    { value: "active", label: t("users.status.active") },
    { value: "inactive", label: t("users.status.inactive") },
    { value: "locked", label: t("users.status.locked") },
  ]

  return (
    <Select
      key={value?.toString() ?? "x"}
      data={options}
      value={value?.toString()}
      onChange={(val) => onChange(val)}
      clearable
      rightSection={<TbChevronDown size="1rem" />}
      autoSelectOnBlur={false}
      size="sm"
      placeholder={t("users.filters.status")}
      {...props}
    />
  )
}
