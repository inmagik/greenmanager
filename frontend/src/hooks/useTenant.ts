import { TenantContext } from "@/context/TenantContext"
import { useContext } from "react"

export function useTenant() {
  return useContext(TenantContext)
}
