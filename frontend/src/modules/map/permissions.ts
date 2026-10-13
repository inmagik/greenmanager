import { INVENTORY_PERMISSIONS } from "@/modules/inventory/permissions"
import { TERRITORY_PERMISSIONS } from "@/modules/territory/permissions"

/** The map has no permissions of its own: it shows the layers the user reads, and opens to who reads one of them. */
export const MAP_PERMISSION = {
  oneOf: [TERRITORY_PERMISSIONS.READ_AREAS, INVENTORY_PERMISSIONS.READ_ELEMENTS],
}
