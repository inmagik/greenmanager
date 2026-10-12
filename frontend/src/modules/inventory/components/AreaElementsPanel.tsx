import { AlertError } from "@/components/AlertError"
import { CheckPermission } from "@/components/CheckPermission"
import { TableEmptyState } from "@/components/Table"
import type { AreaListItem } from "@/modules/territory/types"
import { translateApiError } from "@/utils"
import { Box, Button, Group, Stack } from "@mantine/core"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbListTree } from "react-icons/tb"
import { Link } from "react-router-dom"
import { useElements, type ElementFilters } from "../api/elements"
import { INVENTORY_PERMISSIONS } from "../permissions"
import { CreateElementAction } from "./CreateElementAction"
import { ElementsTable } from "./ElementsTable"

/**
 * The elements present in an area, in its detail; the list of the elements has the other filters, and the removed
 * ones. A new element starts from the area.
 */
export function AreaElementsPanel({ area }: { area: Pick<AreaListItem, "id" | "client"> }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [ordering, setOrdering] = useState("")
  const filters = useMemo<ElementFilters>(
    () => ({ page, ordering: ordering || undefined, client: area.client, area: area.id, removed: "false" }),
    [page, ordering, area.client, area.id]
  )
  const { data, isLoading, error } = useElements(filters)
  const createAction = (
    <CheckPermission permission={INVENTORY_PERMISSIONS.WRITE_ELEMENTS}>
      <CreateElementAction size="xs" client={area.client} area={area.id} />
    </CheckPermission>
  )

  return (
    <Stack gap={0} h="100%">
      <Group justify="space-between" py="xs" px="sm">
        <Button
          variant="default"
          size="xs"
          leftSection={<TbListTree />}
          component={Link}
          to={`/inventory/elements?${new URLSearchParams({ client: area.client, area: area.id })}`}
        >
          {t("inventory.openInList")}
        </Button>
        {createAction}
      </Group>
      {error && (
        <Box px="sm" pb="xs">
          <AlertError
            title={t("inventory.loadError")}
            message={translateApiError(error, t("common.unexpectedError"))}
          />
        </Box>
      )}
      <ElementsTable
        data={data}
        loading={isLoading}
        page={page}
        onPageChange={setPage}
        ordering={ordering}
        onOrderingChange={(value) => {
          setOrdering(value)
          setPage(1)
        }}
        showClient={false}
        showArea={false}
        emptyState={
          <TableEmptyState
            title={t("inventory.areaEmptyTitle")}
            description={t("inventory.areaEmptyDescription")}
            action={createAction}
          />
        }
        noResults={
          <TableEmptyState
            title={t("inventory.areaEmptyTitle")}
            description={t("inventory.areaEmptyDescription")}
            action={createAction}
          />
        }
      />
    </Stack>
  )
}
