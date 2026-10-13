import { useCallback, useRef, useState } from "react"

/** A position of the device, in WGS84, with the accuracy the device declares, in meters. */
export type CurrentPosition = { longitude: number; latitude: number; accuracy: number }

/** Why there is no position: a key of `geolocation.errors`. */
export type PositionError = "insecure" | "unsupported" | "denied" | "unavailable" | "timeout"

const ERRORS: Record<number, PositionError> = { 1: "denied", 2: "unavailable", 3: "timeout" }

/** The error of a request of the position, from the code of `GeolocationPositionError`. */
export function positionError(code: number): PositionError {
  return ERRORS[code] ?? "unavailable"
}

/** Why the browser gives no position at all, `null` if it can. */
export function positionUnavailable(): PositionError | null {
  if (!window.isSecureContext) return "insecure"
  if (!("geolocation" in navigator)) return "unsupported"
  return null
}

const TIMEOUT_MS = 30000

/**
 * Read the position of the device once, from the browser: the GPS on a phone. The browser asks the user for the
 * permission, and gives a position only on HTTPS (or localhost).
 *
 * `locate` gives the position, or `null` with the `error`. A new request drops the result of the one before.
 */
export function useCurrentPosition() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PositionError | null>(null)
  const lastRequest = useRef(0)

  const locate = useCallback(
    () =>
      new Promise<CurrentPosition | null>((resolve) => {
        const request = ++lastRequest.current
        const fail = (reason: PositionError) => {
          setLoading(false)
          setError(reason)
          resolve(null)
        }
        const unavailable = positionUnavailable()
        if (unavailable) return fail(unavailable)
        setLoading(true)
        setError(null)
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (request !== lastRequest.current) return resolve(null)
            setLoading(false)
            resolve({ longitude: coords.longitude, latitude: coords.latitude, accuracy: coords.accuracy })
          },
          (exc) => {
            if (request !== lastRequest.current) return resolve(null)
            fail(positionError(exc.code))
          },
          { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 0 }
        )
      }),
    []
  )

  return { locate, loading, error }
}
