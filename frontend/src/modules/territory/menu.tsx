import { TbMapPin, TbPolygon, TbStack2 } from "react-icons/tb"
import { TERRITORY_PERMISSIONS } from "./permissions"

export function contributeToMenu() {
  return [
    {
      id: "territory",
      label: "Territory",
      path: "/territory",
      parent: null,
      icon: TbMapPin,
      priority: 150,
      permission: TERRITORY_PERMISSIONS.READ_AREAS,
    },
    {
      id: "territory:areas",
      label: "Areas",
      path: "/territory/areas",
      parent: "territory",
      icon: TbPolygon,
      priority: 10,
      permission: TERRITORY_PERMISSIONS.READ_AREAS,
    },
    {
      id: "territory:zones",
      label: "Zones",
      path: "/territory/zones",
      parent: "territory",
      icon: TbStack2,
      priority: 20,
      permission: TERRITORY_PERMISSIONS.READ_AREAS,
    },
  ]
}
