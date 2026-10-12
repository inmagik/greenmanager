import { API_URL } from "@/constants"
import { useCreate, useData, useDelete, useDetail, useList, usePartialUpdate } from "@inmagik/react-crud"
import { fetchApi, useDataFetchingAuth } from "@inmagik/react-crud/dist/crud/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CatalogChoice, CatalogEntry } from "../types"

/** Filters of every catalog (`FixedCatalogFilter` and `ExtensibleCatalogFilter` of the server). */
export type CatalogFilters = {
  page?: number
  ordering?: string
  search?: string
  available?: "true" | "false"
  retired?: "true" | "false"
  /** Extensible catalogs only. */
  hidden?: "true" | "false"
  scope?: "system" | "organization"
  /** Filters of a single catalog, e.g. `rank` of the species. */
  [filter: string]: string | number | undefined
}

/** The values a form sends: the fields of the entry, plus `is_system` when a staff user creates a system entry. */
export type CatalogPayload = Record<string, unknown>

/**
 * The hooks of a catalog, under `api/catalogs/<slug>/`: they are the same for every catalog. `hide/` and `unhide/`
 * exist only in the extensible catalogs.
 *
 * All the query keys start with the endpoint, so a change refreshes lists, details and choices.
 */
export function createCatalogApi<Entry extends CatalogEntry, Choice extends CatalogChoice = CatalogChoice>(
  slug: string
) {
  const endpoint = `${API_URL}/api/catalogs/${slug}`

  function useEntries(filters: CatalogFilters) {
    return useList<Entry>(endpoint, { query: filters })
  }

  function useEntry(id: string | undefined) {
    return useDetail<Entry>(endpoint, id)
  }

  /** The available entries, to pick in a form; not paginated. */
  function useChoices(filters: CatalogFilters = {}) {
    return useData<Choice[]>(`${endpoint}/choices`, {
      query: filters,
      reactQuery: { queryPrefix: [endpoint, "choices"] },
    })
  }

  function useCreateEntry() {
    return useCreate<Entry, CatalogPayload>(endpoint)
  }

  /** Send `revision` with the values of a form: the server refuses the change if the entry changed meanwhile. */
  function useUpdateEntry() {
    return usePartialUpdate<Entry, CatalogPayload & { id: string; revision?: number }>(endpoint)
  }

  function useDeleteEntry() {
    return useDelete(endpoint)
  }

  function useEntryAction(action: "hide" | "unhide") {
    const client = useQueryClient()
    const headers = useDataFetchingAuth()
    return useMutation({
      mutationFn: (id: string): Promise<Entry> => fetchApi(`${endpoint}/${id}/${action}/`, { method: "POST", headers }),
      onSuccess: () => client.invalidateQueries({ queryKey: [endpoint] }),
    })
  }

  /** The organization hides a system entry it does not use: the entry leaves the selects. */
  function useHideEntry() {
    return useEntryAction("hide")
  }

  function useUnhideEntry() {
    return useEntryAction("unhide")
  }

  return {
    slug,
    endpoint,
    historyEndpoint: (id: string) => `${endpoint}/${id}/history`,
    useEntries,
    useEntry,
    useChoices,
    useCreateEntry,
    useUpdateEntry,
    useDeleteEntry,
    useHideEntry,
    useUnhideEntry,
  }
}

export type CatalogApi<
  Entry extends CatalogEntry = CatalogEntry,
  Choice extends CatalogChoice = CatalogChoice,
> = ReturnType<typeof createCatalogApi<Entry, Choice>>
