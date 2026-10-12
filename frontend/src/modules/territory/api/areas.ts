import { geometryKey } from "@/components/Geometry"
import { API_URL } from "@/constants"
import { useCreate, useData, useDelete, useDetail, useList, usePartialUpdate } from "@inmagik/react-crud"
import { fetchApi, useDataFetchingAuth, type ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { useQuery } from "@tanstack/react-query"
import type { Area, AreaChoice, AreaGeometryCheck, AreaGeometryCheckResult, AreaListItem, AreaPayload } from "../types"

export const areasEndpoint = `${API_URL}/api/territory/areas`

export type AreaFilters = {
  page: number
  ordering?: string
  search?: string
  client?: string
  zone?: string
  /** "true": the areas to fix, which overlap others of the client. */
  has_overlaps?: "true"
}

// The query keys of the areas start with their endpoint: a change of an area refreshes them all, including the flags
// of the overlaps of the other areas and the checks of the geometries.

export function useAreas(filters: AreaFilters) {
  return useList<AreaListItem>(areasEndpoint, { query: filters })
}

export function useArea(id: string | undefined) {
  return useDetail<Area>(areasEndpoint, id)
}

/** The areas of a client, to pick in a form or a filter, only those of `zone` if given; nothing without a client. */
export function useAreaChoices(client: string | null | undefined, zone?: string | null) {
  return useData<AreaChoice[]>(`${areasEndpoint}/choices`, {
    query: { client, zone: zone || undefined },
    reactQuery: { queryPrefix: [areasEndpoint, "choices"], enabled: !!client },
  })
}

export function useCreateArea() {
  return useCreate<Area, AreaPayload>(areasEndpoint)
}

type AreaUpdate = Partial<AreaPayload> & Partial<Pick<Area, "revision">> & Pick<Area, "id">

/** Send `revision` with the values of a form: the server refuses the change if the area changed meanwhile. */
export function useUpdateArea() {
  return usePartialUpdate<Area, AreaUpdate>(areasEndpoint)
}

export function useDeleteArea() {
  return useDelete(areasEndpoint)
}

export function areaHistoryEndpoint(id: string) {
  return `${areasEndpoint}/${id}/history`
}

/**
 * Surface, perimeter and warnings of a perimeter before saving it (`geometry-check/`), with the values of the form
 * that change the overlaps. Nothing without a check. It needs `WRITE_AREAS`.
 */
export function useAreaGeometryCheck(check: AreaGeometryCheck | null) {
  const headers = useDataFetchingAuth()
  const { geometry, ...values } = check ?? {}
  return useQuery<AreaGeometryCheckResult, ApiError>({
    queryKey: [areasEndpoint, "geometry-check", geometry ? geometryKey(geometry) : null, values],
    queryFn: ({ signal }) =>
      fetchApi(`${areasEndpoint}/geometry-check/`, {
        method: "POST",
        signal,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(check),
      }),
    enabled: !!check,
  })
}
