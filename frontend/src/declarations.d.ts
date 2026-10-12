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
    // Shown only to the users with the permission in the current tenant.
    permission?: string | { oneOf: string[] } | { allOf: string[] }
  }
  export function getMenuConfig(user: User): MenuItem[]
}

interface ImportMetaEnv {
  /** The basemaps of the map, as a JSON list (`components/Map/basemaps.ts`); without it, the default ones. */
  readonly VITE_BASEMAPS?: string
}
