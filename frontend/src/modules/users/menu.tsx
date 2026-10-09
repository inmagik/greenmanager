import type { User } from "@/auth/types"
import { TbUser, TbUsers, TbVectorBezierCircle } from "react-icons/tb"
import { AUTH_CORE_PERMISSIONS } from "./permissions"
import { hasPermission } from "@/hooks/useHasPermission"

export function contributeToMenu(user: User) {
  return [
    { id: "users", label: "Users", path: "/utenti", parent: null, icon: TbUsers, priority: 1000 },
    { id: "users:users", label: "Users", path: "/utenti/utenti", parent: "users", icon: TbUser, priority: 10, permission: AUTH_CORE_PERMISSIONS.LETTURA_UTENTI },
    {
      id: "users:roles",
      label: "Roles",
      path: "/utenti/ruoli",
      parent: "users",
      icon: TbVectorBezierCircle,
      priority: 20,
      permission: AUTH_CORE_PERMISSIONS.LETTURA_RUOLI,
    },
  ].filter(item => hasPermission(user, item.permission))
}
