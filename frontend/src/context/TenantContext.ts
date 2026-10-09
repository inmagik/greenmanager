import type { Tenant } from "@/auth/types"
import { createContext } from "react"

export type TenantContextValue = {
  tenant: Tenant | null
  tenantId: number | null
  tenants: Tenant[]
  isLoading: boolean
  isReady: boolean
  setTenant: (tenant: number | Tenant | null) => void
  refreshTenants: () => void
}

export const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  tenantId: null,
  tenants: [],
  isLoading: false,
  isReady: true,
  setTenant: () => {},
  refreshTenants: () => {},
})
