import { useAuth } from "@/auth/auth"
import type { User } from "@/auth/types"

export function hasPermission(user: User | null, permission?: string | { oneOf: string[] } | { allOf: string[] }) {
  if (!user) {
    return false
  }
  if (!permission) {
    return true
  }
  if (user.is_superuser) {
    return true
  }

  let allowed = false

  if (typeof permission === "string") {
    allowed = user.all_permissions.includes(permission)
  } else if ("oneOf" in permission) {
    allowed = permission.oneOf.some((p) => user.all_permissions.includes(p))
  } else if ("allOf" in permission) {
    allowed = permission.allOf.every((p) => user.all_permissions.includes(p))
  }

  return allowed
}

export function useHasPermission(permission?: string | { oneOf: string[] } | { allOf: string[] }) {
  const { user } = useAuth()

  return hasPermission(user, permission)
}
