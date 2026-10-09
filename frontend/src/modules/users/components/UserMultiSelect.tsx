import { MultiSelect, type MultiSelectProps } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { useMemo, useState } from "react"
import { useUsers } from "../api/users"
import type { User } from "@/auth/types"

type Props = Omit<MultiSelectProps, "data" | "value" | "onChange" | "searchable" | "searchValue" | "onSearchChange"> & {
  value: User[]
  onChange: (value: User[]) => void
  roleId?: number
}

export function UserMultiSelect({ value, onChange, roleId, ...props }: Props) {
  const [searchValue, setSearchValue] = useState("")

  const [debSearchValue] = useDebouncedValue(searchValue, 300)

  const filters = useMemo(() => ({ page: 1, search: debSearchValue, without_role: roleId }), [debSearchValue, roleId])
  const { data: users } = useUsers(filters)

  const usersById = useMemo(() => {
    const map = new Map<string, User>()

    for (const user of users?.results ?? []) {
      map.set(user.id.toString(), user)
    }

    for (const user of value) {
      map.set(user.id.toString(), user)
    }

    return map
  }, [users?.results, value])

  // Selected users stay among the options, so that their labels are shown.
  const options = Array.from(usersById.values(), (user) => ({
    value: user.id.toString(),
    label: user.full_name || user.email,
  }))

  return (
    <MultiSelect
      searchable
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      data={options}
      value={value.map((user) => user.id.toString())}
      onChange={(val) =>
        onChange(
          val
            .map((id) => usersById.get(id))
            .filter((user): user is User => user !== undefined),
        )
      }
      {...props}
    />
  )
}
