import { AsyncSelect } from "@/components/AsyncSelect/AsyncSelect"
import { useDebouncedValue } from "@mantine/hooks"
import { useMemo, useState } from "react"
import { useRole, useRoles } from "../api/roles"
import { useTranslation } from "react-i18next"

type Props = {
  value: number | null
  onChange: (value: number | null) => void
}

export function RoleFilter({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState<string | null>(null)
  const [debSearchValue] = useDebouncedValue(searchValue, 300)

  const filters = useMemo(() => ({ page: 1, search: debSearchValue ?? "" }), [debSearchValue])
  const { data: roles } = useRoles(filters)
  const { data: selectedRole } = useRole(value)

  const allRoles = []
  if (roles) {
    for (const role of roles.results) {
      allRoles.push(role)
    }
  }

  const options = allRoles.map((role) => ({ value: role.id.toString(), label: role.name })) ?? []

  return (
    <AsyncSelect
      value={value?.toString() ?? ""}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onChange={(val) => {
        onChange(val ? parseInt(val, 10) : null)
      }}
      options={options}
      defaultCaption={selectedRole?.name}
      placeholder={t("users.filters.role")}
    />
  )
}
