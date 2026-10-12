import type { SelectProps } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { elementClassesApi } from "../api/catalogs"
import type { CatalogFilters } from "../api/createCatalogApi"
import { enumLabel } from "../fields"
import type { ElementClassChoice } from "../types"
import { CatalogSelect } from "./CatalogSelect"

type Props = Omit<SelectProps, "data" | "value" | "onChange"> & {
  value: string | null
  /** With the class chosen: its geometry, species mode and attributes drive the form of the element. */
  onChange: (value: string | null, choice: ElementClassChoice | null) => void
  /** Filters of the classes, e.g. their category or their type of geometry. */
  filters?: CatalogFilters
}

/** Choose the class of an element, among the available ones, grouped by category. */
export function ElementClassSelect(props: Props) {
  const { t } = useTranslation()
  return (
    <CatalogSelect
      api={elementClassesApi}
      placeholder={t("catalogs.select.elementClassPlaceholder")}
      group={(choice) => enumLabel(t, "category", choice.category)}
      {...props}
    />
  )
}
