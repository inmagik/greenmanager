import { API_URL } from "@/constants"
import { useAction, useCreate, useDelete, useDetail, useList, usePartialUpdate } from "@inmagik/react-crud"
import { useQueryClient } from "@tanstack/react-query"
import { useMutation, useQuery } from "@tanstack/react-query"
import { fetchApi, useDataFetchingAuth } from "@inmagik/react-crud/dist/crud/utils"
import type { Tenant, TenantPayload } from "../types"

const endpoint = `${API_URL}/api/core/tenants`

export function useTenants(filters: { page: number; ordering?: string; search?: string }) {
  return useList<Tenant>(endpoint, { query: filters })
}

export function useTenantDetail(id: number) {
  return useDetail<Tenant>(endpoint, id.toString())
}

export function useCreateTenant() {
  return useCreate<Tenant, TenantPayload>(endpoint)
}

export function useUpdateTenant() {
  return usePartialUpdate<Tenant, Partial<TenantPayload> & Pick<Tenant, "id">>(endpoint)
}

export function useDeleteTenant() {
  return useDelete<Tenant>(endpoint)
}

export function useBulkDeleteTenants() {
  const queryClient = useQueryClient()
  return useAction(`${endpoint}/bulk-delete`, {
    method: "POST",
    responseType: "raw",
    reactQuery: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
    },
  })
}

export type TenantUser = {
  id: number
  full_name: string
  email: string
  is_member: boolean
}

export type TenantUsersPage = {
  count: number
  full_count: number
  page_size: number
  results: TenantUser[]
}

export function useAvailableTenantUsers(tenantId: number, filters: { page: number; search?: string }) {
  const headers = useDataFetchingAuth()
  const query = new URLSearchParams({ available_only: "1", page: filters.page.toString() })
  if (filters.search) query.set("search", filters.search)
  return useQuery<TenantUsersPage>({
    queryKey: [endpoint, tenantId, "available-users", filters],
    queryFn: () => fetchApi(`${endpoint}/${tenantId}/users/?${query}`, { headers }),
  })
}

export function useTenantMembers(tenantId: number, filters: { page: number; search?: string }) {
  const headers = useDataFetchingAuth()
  const query = new URLSearchParams({ members_only: "1", page: filters.page.toString() })
  if (filters.search) query.set("search", filters.search)
  return useQuery<TenantUsersPage>({
    queryKey: [endpoint, tenantId, "members", filters],
    queryFn: () => fetchApi(`${endpoint}/${tenantId}/users/?${query}`, { headers }),
  })
}

export function useRemoveTenantUser(tenantId: number) {
  const headers = useDataFetchingAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => fetchApi(`${endpoint}/${tenantId}/remove-user/`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  })
}

export function useAddTenantUsers(tenantId: number) {
  const headers = useDataFetchingAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userIds: number[]) =>
      fetchApi(`${endpoint}/${tenantId}/add-users/`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: userIds }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  })
}
