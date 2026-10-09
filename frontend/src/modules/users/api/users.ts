import type { User } from "@/auth/types"
import { API_URL } from "@/constants"
import { useAction, useCreate, useDelete, useDetail, useList, usePartialUpdate } from "@inmagik/react-crud"
import { fetchApi, useDataFetchingAuth } from "@inmagik/react-crud/dist/crud/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"

type UserFilters = {
  page: number
  ordering?: string
  search?: string
  roles?: string
  status?: string
  _sf_roles?: string
}

export function useUsers(filters: UserFilters) {
  return useList<User>(`${API_URL}/api/core/auth/users`, { query: filters })
}

export function useUser(id: number | string) {
  return useDetail<User>(`${API_URL}/api/core/auth/users`, id.toString())
}

export function useCreateUser() {
  return useCreate<User>(`${API_URL}/api/core/auth/users`)
}

export function useUpdateUser() {
  return usePartialUpdate<User>(`${API_URL}/api/core/auth/users`)
}

export function useUnlockUser() {
  const client = useQueryClient()

  const authHeaders = useDataFetchingAuth()

  return useMutation({
    mutationFn: (userId: User["id"]) => {
      const apiUrl = `${API_URL}/api/core/auth/users/${userId}/unlock`
      return fetchApi(apiUrl, {
        method: "POST",
        headers: authHeaders,
      })
    },
    onSuccess: (_result, id) => {
      client.invalidateQueries({ queryKey: [`${API_URL}/api/core/auth/users`] })
      client.invalidateQueries({ queryKey: [`${API_URL}/api/core/auth/users`, id] })
    },
  })
}

export function useDeleteUser() {
  return useDelete(`${API_URL}/api/core/auth/users`)
}

export function useBulkDeleteUsers() {
  const queryClient = useQueryClient()
  return useAction(`${API_URL}/api/core/auth/users/bulk-delete`, {
    method: "POST",
    responseType: "raw",
    reactQuery: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`${API_URL}/api/core/auth/users`] })
      },
    },
  })
}
