import { TbListTree, TbTree } from "react-icons/tb"
import { INVENTORY_PERMISSIONS } from "./permissions"

export function contributeToMenu() {
  return [
    {
      id: "inventory",
      label: "Inventory",
      path: "/inventory",
      parent: null,
      icon: TbTree,
      priority: 160,
      permission: INVENTORY_PERMISSIONS.READ_ELEMENTS,
    },
    {
      id: "inventory:elements",
      label: "Elements",
      path: "/inventory/elements",
      parent: "inventory",
      icon: TbListTree,
      priority: 10,
      permission: INVENTORY_PERMISSIONS.READ_ELEMENTS,
    },
  ]
}
