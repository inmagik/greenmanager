import { AsyncSelect } from "@/components/AsyncSelect"
import { useDebouncedValue } from "@mantine/hooks"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { speciesApi } from "../api/catalogs"
import type { CatalogFilters } from "../api/createCatalogApi"
import { speciesLabel } from "../fields"
import type { SpeciesRank } from "../types"

type Props = {
  value: string | null
  onChange: (value: string | null) => void
  /** Only the entries of these ranks, e.g. the genera as parents of a species. */
  ranks?: SpeciesRank[]
  label?: React.ReactNode
  description?: React.ReactNode
  withAsterisk?: boolean
  placeholder?: string
  error?: React.ReactNode
  disabled?: boolean
}

/**
 * Choose a species, searching among the available ones: the catalog has thousands of entries, so the options are
 * the first page of the search.
 *
 * A value saved before its entry was hidden or retired stays: it is shown, marked as no longer available.
 */
export function SpeciesSelect({ value, onChange, ranks, placeholder, ...props }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState<string | null>(null)
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const filters = useMemo<CatalogFilters>(
    () => ({ page: 1, available: "true", search: debouncedSearch || undefined, rank: ranks }),
    [debouncedSearch, ranks]
  )
  const { data } = speciesApi.useEntries(filters)
  const { data: current } = speciesApi.useEntry(value ?? undefined)
  const options = (data?.results ?? []).map((species) => ({ value: species.id, label: speciesLabel(species) }))
  const caption =
    current &&
    (current.is_available
      ? speciesLabel(current)
      : t("catalogs.select.unavailableOption", { name: speciesLabel(current) }))

  return (
    <AsyncSelect
      value={value ?? ""}
      searchValue={search}
      onSearchChange={setSearch}
      onChange={(newValue) => onChange(newValue)}
      options={options}
      defaultCaption={caption || undefined}
      placeholder={placeholder ?? t("catalogs.select.speciesPlaceholder")}
      {...props}
    />
  )
}
