import { API_URL } from "@/constants"
import { useCreate, useData, useDelete, useDetail, useList, usePartialUpdate } from "@inmagik/react-crud"
import type { Client, ClientChoice, ClientKind, ClientPayload } from "../types"

export const clientsEndpoint = `${API_URL}/api/parties/clients`

export type ClientFilters = {
  page: number
  ordering?: string
  search?: string
  active?: "true" | "false"
  kind?: ClientKind
}

export function useClients(filters: ClientFilters) {
  return useList<Client>(clientsEndpoint, { query: filters })
}

export function useClient(id: string | undefined) {
  return useDetail<Client>(clientsEndpoint, id)
}

/**
 * The clients to pick in a form or a filter, not paginated. The key starts with the endpoint of the clients, so
 * their changes refresh the choices too.
 */
export function useClientChoices(filters: { active?: "true" } = {}) {
  return useData<ClientChoice[]>(`${clientsEndpoint}/choices`, {
    query: filters,
    reactQuery: { queryPrefix: [clientsEndpoint, "choices"] },
  })
}

export function useCreateClient() {
  return useCreate<Client, ClientPayload>(clientsEndpoint)
}

type ClientUpdate = Partial<ClientPayload> & Partial<Pick<Client, "active" | "revision">> & Pick<Client, "id">

/** Send `revision` with the values of a form: the server refuses the change if the client changed meanwhile. */
export function useUpdateClient() {
  return usePartialUpdate<Client, ClientUpdate>(clientsEndpoint)
}

export function useDeleteClient() {
  return useDelete(clientsEndpoint)
}

export function clientHistoryEndpoint(id: string) {
  return `${clientsEndpoint}/${id}/history`
}
