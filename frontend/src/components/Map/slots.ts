import type { LayerSpecification } from "maplibre-gl"

/**
 * The levels of the map, from the bottom, above the basemap. A layer is added at the top of its slot, so the order
 * does not depend on when the layers are mounted:
 * - `surfaces`: large polygons under the rest, such as the areas;
 * - `features`: the censused elements;
 * - `selection`: the feature selected;
 * - `position`: the position of the user.
 */
export const SLOTS = ["surfaces", "features", "selection", "position"] as const
export type Slot = (typeof SLOTS)[number]

/** The empty layer that closes a slot: the layers of the slot are added before it. */
export function slotAnchorId(slot: Slot) {
  return `slot:${slot}`
}

export const SLOT_ANCHOR_LAYERS: LayerSpecification[] = SLOTS.map((slot) => ({
  id: slotAnchorId(slot),
  type: "background",
  layout: { visibility: "none" },
}))
