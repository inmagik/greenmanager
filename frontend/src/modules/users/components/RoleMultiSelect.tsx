import { MultiSelect, type MultiSelectProps } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { useMemo, useState } from "react"
import { useRoles } from "../api/roles"
import type { Role } from "../types"

type Props = Omit<MultiSelectProps, "data" | "value" | "onChange" | "searchable" | "searchValue" | "onSearchChange"> & {
  value: Role[]
  onChange: (value: Role[]) => void
}

export function RoleMultiSelect({ value, onChange, ...props }: Props) {
  const [searchValue, setSearchValue] = useState("")

  const [debSearchValue] = useDebouncedValue(searchValue, 300)

  const filters = useMemo(() => ({ page: 1, search: debSearchValue }), [debSearchValue])
  const { data: roles } = useRoles(filters)

  // Selected roles stay available when the search no longer returns them.
  const rolesById = useMemo(() => {
    const map = new Map<string, Role>()

    for (const role of value) {
      map.set(role.id.toString(), role)
    }

    for (const role of roles?.results ?? []) {
      map.set(role.id.toString(), role)
    }

    return map
  }, [roles?.results, value])

  const options = Array.from(rolesById.values(), (role) => ({ value: role.id.toString(), label: role.name }))

  return (
    <MultiSelect
      searchable
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      data={options}
      value={value.map((role) => role.id.toString())}
      onChange={(val) =>
        onChange(val.map((id) => rolesById.get(id)).filter((role): role is Role => role !== undefined))
      }
      {...props}
    />
  )
}
