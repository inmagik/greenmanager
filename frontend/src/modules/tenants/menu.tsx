import type { User } from "@/auth/types"
import { TbBuilding } from "react-icons/tb"

export function contributeToMenu(user: User) {
  if (!user.is_staff) return []

  return [
    { id: "tenants", label: "Tenants", path: "/tenants", parent: null, icon: TbBuilding, priority: 900 },
  ]
}
