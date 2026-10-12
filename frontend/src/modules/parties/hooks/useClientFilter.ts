import { useTenant } from "@/hooks/useTenant"
import { useCallback, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useClientChoices } from "../api/clients"

const PARAM = "client"

function storageKey(tenantId: number | null) {
  return `greenmanager-client-filter:${tenantId ?? "none"}`
}

// localStorage may be unavailable (private windows, blocked storage): the filter then lives only in the URL.
function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch {
    // Nothing to remember.
  }
}

type Options = {
  /** Parameters of the URL that depend on the client, such as its zone: they are dropped when the client changes. */
  dependentParams?: string[]
}

/**
 * The client as the filter of a list (zones, areas, elements).
 *
 * - It is the `client` parameter of the URL, so the list can be reloaded and shared.
 * - The last value is remembered for each organization in localStorage: a list opened without the parameter starts
 *   from it, and the URL gets it.
 * - A client that is no longer visible (deleted, or of another organization) is dropped.
 * - Every change of the client, chosen or automatic, goes back to the first page and drops the `dependentParams`.
 */
export function useClientFilter({ dependentParams = [] }: Options = {}) {
  const [params, setParams] = useSearchParams()
  const { tenantId } = useTenant()
  const key = storageKey(tenantId)
  const urlValue = params.get(PARAM)
  const value = urlValue || readStored(key)
  const { data: choices } = useClientChoices()
  const dependentKey = dependentParams.join(",")

  const updateUrl = useCallback(
    (client: string | null, { replace }: { replace: boolean }) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (client) next.set(PARAM, client)
          else next.delete(PARAM)
          // The page and the dependent filters were those of another list.
          next.delete("page")
          for (const param of dependentKey ? dependentKey.split(",") : []) next.delete(param)
          return next
        },
        { replace }
      ),
    [setParams, dependentKey]
  )

  useEffect(() => {
    if (!value) return
    const known = choices?.some((client) => client.id === value)
    if (choices && !known) {
      // Forget it only if it is the value remembered for this organization: after a change of organization the URL
      // still has a client of the previous one.
      if (readStored(key) === value) writeStored(key, null)
      updateUrl(null, { replace: true })
    } else if (!urlValue) {
      updateUrl(value, { replace: true })
    } else if (known) {
      // A value from the URL (a shared link, a reload) is remembered once it is known to be visible.
      writeStored(key, value)
    }
  }, [choices, key, updateUrl, urlValue, value])

  const selectClient = useCallback(
    (client: string | null) => {
      writeStored(key, client)
      updateUrl(client, { replace: false })
    },
    [key, updateUrl]
  )
  return [value, selectClient] as const
}
