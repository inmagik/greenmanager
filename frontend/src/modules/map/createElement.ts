import type { ElementClassChoice } from "@/modules/catalogs/types"
import type { PositionValue } from "@/modules/inventory/position"

export type CreateStep = "class" | "position" | "form"

/** The new element on the map page: its class, then its position on the map, then its data. */
export type CreateElementState = {
  step: CreateStep
  elementClass: ElementClassChoice | null
  position: PositionValue | null
  /** The form, once reached, stays mounted while the position changes: its values stay. */
  formShown: boolean
}

export const NEW_ELEMENT: CreateElementState = { step: "class", elementClass: null, position: null, formShown: false }

/** A position the form can save: a geometry, or the coordinates of the device. */
export function hasPosition(position: PositionValue | null): position is PositionValue {
  return !!position && (position.mode === "coordinates" || !!position.geometry)
}

/** The point of a position, to show it on the map. */
export function positionPoint(position: PositionValue | null) {
  if (!position) return null
  if (position.mode === "coordinates" && typeof position.latitude === "number") {
    return { type: "Point" as const, coordinates: [position.longitude as number, position.latitude] }
  }
  return position.geometry?.type === "Point" ? position.geometry : null
}
