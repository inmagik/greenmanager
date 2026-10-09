import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { ReactNode } from "react"
import { useLayoutEffect, useMemo, useState } from "react"
import { useAuth } from "../auth/auth"
import { DataFetchingAuthContext } from "@inmagik/react-crud"
import { useTenant } from "@/hooks/useTenant"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
      refetchOnReconnect: false,
      networkMode: "always",
      staleTime: 1000,
      retry: false,
      structuralSharing: false,
    },
  },
})

type Props = {
  children: ReactNode
}

function ProvideAuthToDataFetching({ children }: Props) {
  const { tokens } = useAuth()
  const { tenantId, isReady } = useTenant()

  const queryClient = useQueryClient()
  const [activeTenantId, setActiveTenantId] = useState<number | null>(tenantId)

  useLayoutEffect(() => {
    if (activeTenantId !== tenantId) {
      queryClient.cancelQueries()
      queryClient.removeQueries()
      // The children render only after the cache of the previous tenant is cleared.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTenantId(tenantId)
    }
  }, [activeTenantId, queryClient, tenantId])

  const authHeaders: Record<string, string> = useMemo(() => {
    const headers: Record<string, string> = tokens?.access ? { Authorization: `Bearer ${tokens?.access}` } : {}
    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId.toString()
    }
    return headers
  }, [tokens?.access, tenantId])

  if (tokens?.access && (!isReady || activeTenantId !== tenantId)) {
    return <div />
  }

  return <DataFetchingAuthContext.Provider value={authHeaders}>{children}</DataFetchingAuthContext.Provider>
}

export default function DataProvider({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProvideAuthToDataFetching>{children}</ProvideAuthToDataFetching>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </QueryClientProvider>
  )
}
