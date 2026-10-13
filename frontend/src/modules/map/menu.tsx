import { TbMap } from "react-icons/tb"
import { MAP_PERMISSION } from "./permissions"

export function contributeToMenu() {
  return [
    {
      id: "map",
      label: "Map",
      path: "/map",
      parent: null,
      icon: TbMap,
      priority: 50,
      permission: MAP_PERMISSION,
    },
  ]
}
