import { TbBriefcase } from "react-icons/tb"
import { PARTIES_PERMISSIONS } from "./permissions"

export function contributeToMenu() {
  return [
    {
      id: "parties",
      label: "Clients",
      path: "/parties/clients",
      parent: null,
      icon: TbBriefcase,
      priority: 100,
      permission: PARTIES_PERMISSIONS.READ_CLIENTS,
    },
  ]
}
