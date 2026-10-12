import { useTenantUser } from "@/hooks/useHasPermission"
import type { CatalogDefinition } from "../definitions"
import type { CatalogEntry } from "../types"

/**
 * The rules of the server on what can be written in a catalog, beside `WRITE_CATALOGS`, which the pages check with
 * `CheckPermission`: only staff users change the system entries (`system_entry_read_only`), and some catalogs have no
 * entries of the organizations.
 */
export function useCatalogPermissions(catalog: CatalogDefinition) {
  const user = useTenantUser()
  const isStaff = !!user && (user.is_staff || user.is_superuser)
  return {
    isStaff,
    /** Organizations add entries to some catalogs only; staff users add system entries to every catalog. */
    canCreate: catalog.organizationEntries || isStaff,
    canEdit: (entry: CatalogEntry) => !entry.is_system || isStaff,
    /** Hiding is a choice of the organization, on the system entries of the extensible catalogs. */
    canHide: (entry: CatalogEntry) => catalog.extensible && entry.is_system,
  }
}
