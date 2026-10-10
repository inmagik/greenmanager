declare module "virtual:routes" {
  import type { RouteObject } from "react-router-dom"
  export const MODULES_ROUTES: RouteObject[]
}

declare module "virtual:menu" {
  import type { User } from "./auth/types"
  type MenuItem = {
    id: string
    label: string
    path: string
    parent: string | null
    icon: React.ElementType
    priority: number
  }
  export function getMenuConfig(user: User): MenuItem[]
}
