import { useAuth } from "@/auth/auth"
import type { User } from "@/auth/types"
import { useTenant } from "@/hooks/useTenant"
import { useMemo } from "react"

/**
 * Permissions of the user in a tenant: the direct ones plus those of the roles of
 * that tenant, as the server computes them. `all_permissions` of `me/` joins the
 * roles of every tenant.
 */
export function tenantPermissions(user: User, tenantId: number | null): string[] {
  const rolePermissions = user.roles_data.filter((role) => role.tenant === tenantId).flatMap((role) => role.permissions)
  return Array.from(new Set([...user.permissions, ...rolePermissions]))
}

/** The current user with `all_permissions` of the current tenant. */
export function useTenantUser(): User | null {
  const { user } = useAuth()
  const { tenantId } = useTenant()
  return useMemo(
    () => (user ? { ...user, all_permissions: tenantPermissions(user, tenantId) } : null),
    [user, tenantId]
  )
}

/** Whether the user has the permission; pass the user of `useTenantUser()`. */
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
  const user = useTenantUser()

  return hasPermission(user, permission)
}
