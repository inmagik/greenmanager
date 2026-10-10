import type { User } from "@/auth/types"
import { TbUser, TbUsers, TbVectorBezierCircle } from "react-icons/tb"
import { AUTH_CORE_PERMISSIONS } from "./permissions"
import { hasPermission } from "@/hooks/useHasPermission"

export function contributeToMenu(user: User) {
  return [
    {
      id: "users",
      label: "Users",
      path: "/users",
      parent: null,
      icon: TbUsers,
      priority: 1000,
      // The section shows when at least one of its pages does.
      permission: { oneOf: [AUTH_CORE_PERMISSIONS.READ_USERS, AUTH_CORE_PERMISSIONS.READ_ROLES] },
    },
    {
      id: "users:users",
      label: "Users",
      path: "/users/users",
      parent: "users",
      icon: TbUser,
      priority: 10,
      permission: AUTH_CORE_PERMISSIONS.READ_USERS,
    },
    {
      id: "users:roles",
      label: "Roles",
      path: "/users/roles",
      parent: "users",
      icon: TbVectorBezierCircle,
      priority: 20,
      permission: AUTH_CORE_PERMISSIONS.READ_ROLES,
    },
  ].filter(item => hasPermission(user, item.permission))
}
