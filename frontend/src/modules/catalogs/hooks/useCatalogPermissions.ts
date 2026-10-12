import { hasPermission, useTenantUser } from "@/hooks/useHasPermission"
import type { CatalogDefinition } from "../definitions"
import { CATALOGS_PERMISSIONS } from "../permissions"
import type { CatalogEntry } from "../types"

/**
 * What the user can do in a catalog, as the server allows it: writing needs `WRITE_CATALOGS`, and only staff users
 * change the system entries (`system_entry_read_only`).
 */
export function useCatalogPermissions(catalog: CatalogDefinition) {
  const user = useTenantUser()
  const canWrite = hasPermission(user, CATALOGS_PERMISSIONS.WRITE_CATALOGS)
  const isStaff = !!user && (user.is_staff || user.is_superuser)
  return {
    isStaff,
    /** Organizations add entries to some catalogs only; staff users add system entries to every catalog. */
    canCreate: canWrite && (catalog.organizationEntries || isStaff),
    canEdit: (entry: CatalogEntry) => canWrite && (!entry.is_system || isStaff),
    /** Hiding is a choice of the organization, on the system entries of the extensible catalogs. */
    canHide: (entry: CatalogEntry) => canWrite && catalog.extensible && entry.is_system,
  }
}
