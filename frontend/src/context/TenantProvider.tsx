import type { Tenant } from "@/auth/types"
import { useAuth } from "@/auth/auth"
import { API_URL } from "@/constants"
import { TenantContext } from "@/context/TenantContext"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"

const STORAGE_KEY = "greenmanager.selectedTenantId"

type Props = {
  children: ReactNode
}

type PaginatedResponse<T> = {
  results: T[]
  next: string | null
}

async function fetchAllTenants(url: string, accessToken: string, signal: AbortSignal): Promise<Tenant[]> {
  const tenants: Tenant[] = []
  let nextUrl: string | null = url

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    })
    if (!response.ok) {
      throw new Error(`Unable to load tenants: ${response.status}`)
    }

    const payload = (await response.json()) as Tenant[] | PaginatedResponse<Tenant>
    if (Array.isArray(payload)) {
      tenants.push(...payload)
      nextUrl = null
    } else {
      tenants.push(...payload.results)
      nextUrl = payload.next
    }
  }

  return tenants
}

function getStoredTenantId() {
  const storedId = window.localStorage.getItem(STORAGE_KEY)
  if (!storedId) {
    return null
  }
  const parsed = Number.parseInt(storedId, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function TenantProvider({ children }: Props) {
  const { tokens, user } = useAuth()
  // The tenants depend on who the user is, not on their data (e.g. after a profile update).
  const userId = user?.id
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenant, setTenantState] = useState<Tenant | null>(null)
  const [tenantId, setTenantId] = useState<number | null>(getStoredTenantId)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function loadTenants() {
      if (!tokens?.access || !userId) {
        setTenants([])
        setTenantState(null)
        setTenantId(null)
        setIsReady(true)
        return
      }

      setIsLoading(true)
      setIsReady(false)
      try {
        const nextTenants = await fetchAllTenants(
          `${API_URL}/api/core/tenants/`,
          tokens.access,
          controller.signal,
        )
        if (cancelled) {
          return
        }

        setTenants(nextTenants)

        const storedTenantId = getStoredTenantId()
        const storedTenant = storedTenantId ? nextTenants.find((item) => item.id === storedTenantId) : null
        const firstTenant = nextTenants[0] ?? null
        const nextTenant = storedTenant ?? firstTenant
        setTenantState(nextTenant)
        if (nextTenant) {
          setTenantId(nextTenant.id)
          window.localStorage.setItem(STORAGE_KEY, nextTenant.id.toString())
        } else {
          setTenantId(null)
          window.localStorage.removeItem(STORAGE_KEY)
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error)
          setTenants([])
          setTenantState(null)
          setTenantId(null)
          window.localStorage.removeItem(STORAGE_KEY)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsReady(true)
        }
      }
    }

    loadTenants()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [tokens?.access, userId, refreshVersion])

  const refreshTenants = useCallback(() => setRefreshVersion((version) => version + 1), [])

  const setTenant = useCallback(
    (value: number | Tenant | null) => {
      if (value === null) {
        setTenantState(null)
        setTenantId(null)
        window.localStorage.removeItem(STORAGE_KEY)
        return
      }

      const nextTenant = typeof value === "number" ? tenants.find((item) => item.id === value) ?? null : value
      setTenantState(nextTenant)
      if (nextTenant) {
        setTenantId(nextTenant.id)
        window.localStorage.setItem(STORAGE_KEY, nextTenant.id.toString())
      }
    },
    [tenants]
  )

  const contextValue = useMemo(
    () => ({
      tenant,
      tenantId,
      tenants,
      isLoading,
      isReady,
      setTenant,
      refreshTenants,
    }),
    [tenant, tenantId, tenants, isLoading, isReady, setTenant, refreshTenants]
  )

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>
}
