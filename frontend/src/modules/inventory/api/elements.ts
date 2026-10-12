import { geometryKey } from "@/components/Geometry"
import { API_URL } from "@/constants"
import type { ElementCategory } from "@/modules/catalogs/types"
import { useCreate, useData, useDelete, useDetail, useList, usePartialUpdate } from "@inmagik/react-crud"
import type { PaginatedDJResponse } from "@inmagik/react-crud/dist/types"
import { fetchApi, useDataFetchingAuth, type ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  Element,
  ElementGeometryCheck,
  ElementGeometryCheckResult,
  ElementListItem,
  ElementPayload,
  ElementPosition,
  ElementRemoval,
  LocationStatus,
} from "../types"

export const elementsEndpoint = `${API_URL}/api/inventory/elements`

export type ElementFilters = {
  page: number
  ordering?: string
  search?: string
  client?: string
  area?: string
  zone?: string
  element_class?: string
  category?: ElementCategory
  species?: string
  location_status?: LocationStatus
  removed?: "true" | "false"
  /** The elements present on a date (`YYYY-MM-DD`): planted by then, and not yet removed. */
  present_on?: string
  outside_area?: "true" | "false"
}

// The query keys of the elements start with their endpoint: a change of an element refreshes them all, including the
// checks of the positions, whose near trees may have changed.

export function useElements(filters: ElementFilters) {
  return useList<ElementListItem>(elementsEndpoint, { query: filters })
}

/** The first page of a search among the elements of a client, to pick one in a form; nothing without a client. */
export function useElementSearch(filters: ElementFilters) {
  return useData<PaginatedDJResponse<ElementListItem>>(elementsEndpoint, {
    query: filters,
    reactQuery: { enabled: !!filters.client },
  })
}

export function useElement(id: string | undefined) {
  return useDetail<Element>(elementsEndpoint, id)
}

export function useCreateElement() {
  return useCreate<Element, ElementPayload>(elementsEndpoint)
}

type ElementUpdate = Partial<ElementPayload> &
  Partial<ElementPosition> &
  Partial<Pick<Element, "revision">> &
  Pick<Element, "id">

/** Send `revision` with the values of a form: the server refuses the change if the element changed meanwhile. */
export function useUpdateElement() {
  return usePartialUpdate<Element, ElementUpdate>(elementsEndpoint)
}

export function useDeleteElement() {
  return useDelete(elementsEndpoint)
}

export function elementHistoryEndpoint(id: string) {
  return `${elementsEndpoint}/${id}/history`
}

/**
 * An action of the life cycle (`remove/`, `restore/`). They change only the removal, so they do not send the
 * revision: they do not overwrite the other data (§9.2 of frontend.md).
 */
function useElementAction<Data>(action: "remove" | "restore") {
  const client = useQueryClient()
  const headers = useDataFetchingAuth()
  return useMutation<Element, ApiError, Data & { id: string }>({
    mutationFn: ({ id, ...data }) =>
      fetchApi(`${elementsEndpoint}/${id}/${action}/`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: [elementsEndpoint] }),
  })
}

/** Remove the element on a date, with its cause; on a removed element, correct date and cause. */
export function useRemoveElement() {
  return useElementAction<ElementRemoval>("remove")
}

/** Restore an element removed by mistake. */
export function useRestoreElement() {
  return useElementAction<{ reason: string }>("restore")
}

/**
 * Measures, proposed area and warnings of a position before saving it (`geometry-check/`); nothing without a check.
 * It needs `WRITE_ELEMENTS`.
 */
export function useElementGeometryCheck(check: ElementGeometryCheck | null) {
  const headers = useDataFetchingAuth()
  const { geometry, ...values } = check ?? {}
  return useQuery<ElementGeometryCheckResult, ApiError>({
    queryKey: [elementsEndpoint, "geometry-check", geometry ? geometryKey(geometry) : null, values],
    queryFn: ({ signal }) =>
      fetchApi(`${elementsEndpoint}/geometry-check/`, {
        method: "POST",
        signal,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(check),
      }),
    enabled: !!check,
    // The result of the position before stays while the new one arrives, e.g. with the area just proposed.
    placeholderData: keepPreviousData,
  })
}
