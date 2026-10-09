import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

export function useUrlParams() {
  const [params, setParams] = useSearchParams()
  const mergeParams = useCallback(
    (arg: Record<string, string | number | string[]>) => {
      setParams((newParams) => {
        const nextParams = new URLSearchParams(newParams)
        for (const key in arg) {
          const value = arg[key]
          if (Array.isArray(value)) {
            nextParams.delete(key)
            value.forEach((v) => nextParams.append(key, v.toString()))
          } else {
            nextParams.set(key, value.toString())
          }
        }
        return nextParams
      })
    },
    [setParams]
  )
  return [params, setParams, mergeParams] as const
}
