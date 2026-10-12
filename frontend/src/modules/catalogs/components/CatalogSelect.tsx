import { Loader, Select, type ComboboxItem, type ComboboxItemGroup, type SelectProps } from "@mantine/core"
import { useTranslation } from "react-i18next"
import type { CatalogApi, CatalogFilters } from "../api/createCatalogApi"
import type { CatalogChoice, CatalogEntry } from "../types"

type Props<Choice extends CatalogChoice> = Omit<SelectProps, "data" | "value" | "onChange"> & {
  api: Pick<CatalogApi<CatalogEntry, Choice>, "useChoices" | "useEntry">
  value: string | null
  onChange: (value: string | null, choice: Choice | null) => void
  /** Filters of the choices, e.g. the category of the classes. */
  filters?: CatalogFilters
  /** The group of an option, e.g. the category of a class. */
  group?: (choice: Choice) => string
  /** Entries left out of the options, e.g. those already in a list. */
  exclude?: string[]
}

/**
 * Choose an entry of a catalog in a form, among the entries available to the organization (`choices/`).
 *
 * A value saved before its entry was hidden or retired stays valid: it is shown, marked as no longer available. A
 * value left out by `filters` or `exclude` is shown too, without the mark if it is available.
 */
export function CatalogSelect<Choice extends CatalogChoice>({
  api,
  value,
  onChange,
  filters,
  group,
  exclude,
  error,
  ...props
}: Props<Choice>) {
  const { t } = useTranslation()
  const { data: choices, isLoading, isError } = api.useChoices(filters)
  const missing = !!value && !!choices && !choices.some((choice) => choice.id === value)
  const { data: current } = api.useEntry(missing ? value : undefined)

  const options: (ComboboxItem | ComboboxItemGroup<ComboboxItem>)[] = []
  if (missing && current) {
    const label = current.is_available ? current.name : t("catalogs.select.unavailableOption", { name: current.name })
    options.push({ value: current.id, label })
  }
  const groups = new Map<string, ComboboxItem[]>()
  for (const choice of choices ?? []) {
    if (exclude?.includes(choice.id)) continue
    const option = { value: choice.id, label: choice.name }
    if (!group) {
      options.push(option)
      continue
    }
    const name = group(choice)
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name)!.push(option)
  }
  for (const [name, items] of groups) options.push({ group: name, items })

  return (
    <Select
      searchable
      placeholder={t("catalogs.select.placeholder")}
      nothingFoundMessage={t("common.noResults")}
      rightSection={isLoading ? <Loader size="xs" /> : undefined}
      {...props}
      data={options}
      value={value}
      onChange={(newValue) => onChange(newValue, choices?.find((choice) => choice.id === newValue) ?? null)}
      error={error ?? (isError ? t("catalogs.loadError") : undefined)}
    />
  )
}
