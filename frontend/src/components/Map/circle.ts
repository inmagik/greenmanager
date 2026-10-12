import type { Polygon } from "geojson"

const EARTH_RADIUS_M = 6371008.8

/**
 * A circle on the map, as a polygon of `steps` vertices: e.g. the accuracy of a position. The vertices are at
 * `radius` meters from the center on a sphere, close enough to the ellipsoid for a few hundred meters.
 */
export function circlePolygon([longitude, latitude]: [number, number], radius: number, steps = 64): Polygon {
  const angular = radius / EARTH_RADIUS_M
  const lat = (latitude * Math.PI) / 180
  const lon = (longitude * Math.PI) / 180
  const ring: [number, number][] = []
  for (let step = 0; step < steps; step++) {
    const bearing = (2 * Math.PI * step) / steps
    const lat2 = Math.asin(Math.sin(lat) * Math.cos(angular) + Math.cos(lat) * Math.sin(angular) * Math.cos(bearing))
    const lon2 =
      lon +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat),
        Math.cos(angular) - Math.sin(lat) * Math.sin(lat2)
      )
    ring.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI])
  }
  ring.push(ring[0])
  return { type: "Polygon", coordinates: [ring] }
}
