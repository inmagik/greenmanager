import { API_URL } from "@/constants"
import { useCreate, useDelete, useDetail, useList, usePartialUpdate, useAction } from "@inmagik/react-crud"
import type { Role } from "../types"
import { useQueryClient } from "@tanstack/react-query"

type RoleFilters = {
  page: number
  ordering?: string
  search?: string
}

export function useRoles(filters: RoleFilters) {
  return useList<Role>(`${API_URL}/api/core/auth/roles`, { query: filters })
}

export function useRole(id: number | null) {
  return useDetail<Role>(`${API_URL}/api/core/auth/roles`, id?.toString(), {
    reactQuery: { enabled: !!id, queryKey: [`${API_URL}/api/core/auth/roles`, id?.toString()] },
  })
}

export function useCreateRole() {
  return useCreate<Role>(`${API_URL}/api/core/auth/roles`)
}
export function useUpdateRole() {
  return usePartialUpdate<Role>(`${API_URL}/api/core/auth/roles`)
}

export function useDeleteRole() {
  return useDelete<Role>(`${API_URL}/api/core/auth/roles`)
}

export function useGrantRoleToUsers(id: number) {
  return useAction(`${API_URL}/api/core/auth/roles/${id}/grant_to`)
}

export function useRevokeRoleFromUsers(id: number) {
  return useAction(`${API_URL}/api/core/auth/roles/${id}/revoke_from`)
}

export function useBulkDeleteRoles() {
  const queryClient = useQueryClient()
  return useAction(`${API_URL}/api/core/auth/roles/bulk-delete`, {
    method: "POST",
    responseType: "raw",
    reactQuery: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`${API_URL}/api/core/auth/roles`] })
      },
    },
  })
}
