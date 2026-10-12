import { AsyncSelect } from "@/components/AsyncSelect"
import { useDebouncedValue } from "@mantine/hooks"
import dayjs from "dayjs"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useElementSearch, type ElementFilters } from "../api/elements"
import { elementLabel } from "./elementModals"

type Props = {
  /** The elements are those of the client: without a client, the select is disabled. */
  client: string | null
  value: string | null
  /** The code of the saved value, shown until the user picks another. */
  valueCaption?: string
  onChange: (value: string | null) => void
  /** The element being changed, which does not replace itself. */
  exclude?: string
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
}

/**
 * Choose the removed element whose place an element takes (D-029), searching by code among the removed elements of
 * the client: the options are the first page of the search.
 */
export function ElementSelect({ client, value, valueCaption, onChange, exclude, ...props }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState<string | null>(null)
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const filters = useMemo<ElementFilters>(
    () => ({ page: 1, client: client ?? undefined, removed: "true", search: debouncedSearch || undefined }),
    [client, debouncedSearch]
  )
  const { data } = useElementSearch(filters)
  const options = (data?.results ?? [])
    .filter((element) => element.id !== exclude)
    .map((element) => ({
      value: element.id,
      label: t("inventory.elementSelect.option", {
        label: elementLabel(element),
        date: dayjs(element.removed_on).format("DD/MM/YYYY"),
      }),
    }))

  return (
    <AsyncSelect
      value={value ?? ""}
      searchValue={search}
      onSearchChange={setSearch}
      onChange={(newValue) => onChange(newValue)}
      options={options}
      defaultCaption={valueCaption}
      placeholder={t(client ? "inventory.elementSelect.placeholder" : "inventory.elementSelect.noClient")}
      disabled={!client}
      {...props}
    />
  )
}
