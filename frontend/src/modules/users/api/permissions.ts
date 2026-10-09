import { API_URL } from "@/constants"
import { usePlainList } from "@inmagik/react-crud"
import type { Permission } from "../types"

export function usePermissions() {
  return usePlainList<Permission>(`${API_URL}/api/core/auth/permissions`)
}
