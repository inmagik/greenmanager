import { createTable } from "@/components/Table"
import { speciesLabel } from "@/modules/catalogs/fields"
import type { SpeciesMode } from "@/modules/catalogs/types"
import { areaLabel } from "@/modules/territory/components/areaModals"
import type { PaginatedDJResponse } from "@inmagik/react-crud/dist/types"
import { Badge, Group, Pagination, Text } from "@mantine/core"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import type { ElementListItem } from "../types"
import { ElementContextActions } from "./ElementContextActions"

const Table = createTable<ElementListItem>()

// Without a single species, the element of these classes has its composition (the list does not give it).
const COMPOSITION_MODES: SpeciesMode[] = ["composition", "single_or_composition"]

function formatDate(value: string | null) {
  return value ? dayjs(value).format("DD/MM/YYYY") : "—"
}

type Props = {
  data: PaginatedDJResponse<ElementListItem> | undefined
  loading: boolean
  page: number
  onPageChange: (page: number) => void
  /** The ordering of the server, e.g. `-code`; empty for its default, the code. */
  ordering: string
  onOrderingChange: (ordering: string) => void
  /** Columns left out when a filter makes them the same on every row. */
  showClient?: boolean
  showArea?: boolean
  /** The date of the removal, when the list has removed elements. */
  showRemoval?: boolean
  /** Shown when there are no elements at all, and when the filters leave none. */
  emptyState: React.ReactNode
  noResults: React.ReactNode
}

/** The elements of a list or of an area: code, class with the marks, species, area, tag, dates, actions. */
export function ElementsTable({
  data,
  loading,
  page,
  onPageChange,
  ordering,
  onOrderingChange,
  showClient = true,
  showArea = true,
  showRemoval = false,
  emptyState,
  noResults,
}: Props) {
  const { t } = useTranslation()
  const pages = Math.ceil((data?.count ?? 0) / (data?.page_size || 20))

  return (
    <Table
      data={data?.results ?? []}
      loading={loading}
      style={{ flexGrow: 1 }}
      orderBy={ordering.replace("-", "")}
      orderDirection={ordering.startsWith("-") ? "desc" : "asc"}
      onOrderChange={(field, direction) => onOrderingChange(field ? `${direction === "desc" ? "-" : ""}${field}` : "")}
    >
      {data?.full_count === 0 && <Table.Extra.BeforeContent>{emptyState}</Table.Extra.BeforeContent>}
      {!!data?.full_count && data.count === 0 && <Table.Extra.BeforeContent>{noResults}</Table.Extra.BeforeContent>}
      <Table.HeaderConfig sticky />
      <Table.Column
        title="inventory.fields.code"
        name="code"
        sortable
        width="110px"
        render={(element) => (
          <Link to={`/inventory/elements/${element.id}`}>
            <Text fw={500} td="underline">
              {element.code}
            </Text>
          </Link>
        )}
      />
      <Table.Column
        title="inventory.fields.elementClass"
        name="element_class"
        render={(element) => (
          <Group gap={6} wrap="wrap">
            <Text size="sm">{element.element_class_data.name}</Text>
            {element.removed_on && <Badge color="gray">{t("inventory.removed")}</Badge>}
            {element.outside_area && <Badge color="yellow">{t("inventory.outsideArea")}</Badge>}
            {element.location_status === "provisional" && (
              <Badge color="yellow" variant="light">
                {t("inventory.provisional")}
              </Badge>
            )}
          </Group>
        )}
      />
      <Table.Column
        title="inventory.columns.species"
        name="species"
        mobileHidden
        render={(element) =>
          element.species_data
            ? speciesLabel(element.species_data)
            : COMPOSITION_MODES.includes(element.element_class_data.species_mode)
              ? t("inventory.fields.composition")
              : "—"
        }
      />
      {showArea && (
        <Table.Column
          title="inventory.fields.area"
          name="area"
          mobileHidden
          render={(element) => areaLabel(element.area_data)}
        />
      )}
      {showClient && (
        <Table.Column
          title="inventory.fields.client"
          name="client"
          mobileHidden
          render={(element) => element.client_data.name}
        />
      )}
      <Table.Column
        title="inventory.columns.tagNumber"
        name="tag_number"
        sortable
        mobileHidden
        render={(element) => element.tag_number || "—"}
      />
      <Table.Column
        title="inventory.columns.plantedOn"
        name="planted_on"
        sortable
        mobileHidden
        render={(element) => formatDate(element.planted_on)}
      />
      {showRemoval && (
        <Table.Column
          title="inventory.columns.removedOn"
          name="removed_on"
          sortable
          mobileHidden
          render={(element) => formatDate(element.removed_on)}
        />
      )}
      <Table.Column
        title="fields.actions"
        name="_actions"
        width="80px"
        cellAlign="end"
        headerAlign="end"
        render={(element) => <ElementContextActions element={element} />}
      />
      <Table.Footer.Left>
        <Pagination value={page} onChange={onPageChange} total={pages} />
      </Table.Footer.Left>
      <Table.Footer.Right>
        <Text size="sm" ta="right">
          {t("inventory.results", { shown: data?.results.length ?? 0, total: data?.count ?? 0 })}
        </Text>
      </Table.Footer.Right>
    </Table>
  )
}
