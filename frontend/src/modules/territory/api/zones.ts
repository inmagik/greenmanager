import { API_URL } from "@/constants"
import { useCreate, useData, useDelete, useDetail, useList, usePartialUpdate } from "@inmagik/react-crud"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import type { Zone, ZoneChoice, ZonePayload } from "../types"
import { areasEndpoint } from "./areas"

export const zonesEndpoint = `${API_URL}/api/territory/zones`

export type ZoneFilters = {
  page: number
  ordering?: string
  search?: string
  client?: string
}

/** After a change, the zones and the areas: the lists of the areas show the code and the name of their zone. */
function invalidateZones(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: [zonesEndpoint] }),
    client.invalidateQueries({ queryKey: [areasEndpoint] }),
  ])
}

export function useZones(filters: ZoneFilters) {
  return useList<Zone>(zonesEndpoint, { query: filters })
}

export function useZone(id: string | undefined) {
  return useDetail<Zone>(zonesEndpoint, id)
}

/** The zones of a client, to pick in a form or a filter; nothing without a client. */
export function useZoneChoices(client: string | null | undefined) {
  return useData<ZoneChoice[]>(`${zonesEndpoint}/choices`, {
    query: { client },
    reactQuery: { queryPrefix: [zonesEndpoint, "choices"], enabled: !!client },
  })
}

export function useCreateZone() {
  const client = useQueryClient()
  return useCreate<Zone, ZonePayload>(zonesEndpoint, { reactQuery: { onSuccess: () => invalidateZones(client) } })
}

type ZoneUpdate = Partial<ZonePayload> & Partial<Pick<Zone, "revision">> & Pick<Zone, "id">

/** Send `revision` with the values of a form: the server refuses the change if the zone changed meanwhile. */
export function useUpdateZone() {
  const client = useQueryClient()
  return usePartialUpdate<Zone, ZoneUpdate>(zonesEndpoint, { reactQuery: { onSuccess: () => invalidateZones(client) } })
}

export function useDeleteZone() {
  const client = useQueryClient()
  return useDelete(zonesEndpoint, { reactQuery: { onSuccess: () => invalidateZones(client) } })
}

export function zoneHistoryEndpoint(id: string) {
  return `${zonesEndpoint}/${id}/history`
}
