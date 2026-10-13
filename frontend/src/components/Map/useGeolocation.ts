import {
  positionError,
  positionUnavailable,
  type CurrentPosition,
  type PositionError,
} from "@/hooks/useCurrentPosition"
import { useEffect, useState } from "react"

/**
 * The position of the device while `enabled`, followed as it changes (`watchPosition`), with the accuracy the device
 * declares. The errors are those of `useCurrentPosition`, translated by `geolocation.errors`; the browser gives the
 * position only on HTTPS (or localhost).
 */
export function useGeolocation(enabled: boolean) {
  const [position, setPosition] = useState<CurrentPosition | null>(null)
  const [watchError, setWatchError] = useState<PositionError | null>(null)
  const unavailable = enabled ? positionUnavailable() : null

  useEffect(() => {
    if (!enabled || positionUnavailable()) return
    const watch = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setWatchError(null)
        setPosition({ longitude: coords.longitude, latitude: coords.latitude, accuracy: coords.accuracy })
      },
      (exc) => setWatchError(positionError(exc.code)),
      { enableHighAccuracy: true, maximumAge: 0 }
    )
    return () => {
      navigator.geolocation.clearWatch(watch)
      // A new watch starts without the position and the error of the one before.
      setPosition(null)
      setWatchError(null)
    }
  }, [enabled])

  return { position: enabled ? position : null, error: unavailable ?? (enabled ? watchError : null) }
}
