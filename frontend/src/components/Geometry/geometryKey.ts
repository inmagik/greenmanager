// A geometry can be large, and a query key is serialized at every render: the key has a number for each geometry.
const geometryIds = new WeakMap<object, number>()
let lastGeometryId = 0

/** A number for a geometry object, for the query keys of the checks: the same object gives the same number. */
export function geometryKey(geometry: object) {
  let id = geometryIds.get(geometry)
  if (id === undefined) {
    id = ++lastGeometryId
    geometryIds.set(geometry, id)
  }
  return id
}
