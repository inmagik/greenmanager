import { describe, expect, it } from "vitest"
import { bboxParam, clampBbox, geometryBounds, snapBbox } from "./bbox"

describe("clampBbox", () => {
  it("keeps every value within the limits of WGS84", () => {
    expect(clampBbox([-200, -95, 190, 91])).toEqual([-180, -90, 180, 90])
    // Not only the edges: a box beyond the limits on one side.
    expect(clampBbox([185, 10, 190, 20])).toEqual([180, 10, 180, 20])
  })

  it("leaves a box within the limits as it is", () => {
    expect(clampBbox([11, 44, 12, 45])).toEqual([11, 44, 12, 45])
  })
})

describe("snapBbox", () => {
  it("enlarges the box to the grid of the zoom", () => {
    // At zoom 10 a step is 360 / 1024 = 0.3515625 degrees.
    expect(snapBbox([11.3, 44.4, 11.4, 44.5], 10)).toEqual([11.25, 44.296875, 11.6015625, 44.6484375])
  })

  it("gives the same box for a small move", () => {
    expect(snapBbox([11.3, 44.4, 11.4, 44.5], 10)).toEqual(snapBbox([11.301, 44.401, 11.401, 44.501], 10))
  })

  it("uses the integer zoom", () => {
    expect(snapBbox([11.3, 44.4, 11.4, 44.5], 10.7)).toEqual(snapBbox([11.3, 44.4, 11.4, 44.5], 10))
  })

  it("stays within the limits of WGS84", () => {
    expect(snapBbox([-179.9, -89.9, 179.9, 89.9], 0)).toEqual([-180, -90, 180, 90])
  })
})

describe("bboxParam", () => {
  it("writes the box with six decimals at most", () => {
    expect(bboxParam([11.123456789, 44, 12.5, 45.1])).toBe("11.123457,44,12.5,45.1")
  })
})

describe("geometryBounds", () => {
  it("gives the box of the positions of several geometries", () => {
    expect(
      geometryBounds([
        { type: "Point", coordinates: [11, 44] },
        {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [12, 43],
                [13, 43],
                [13, 45],
                [12, 43],
              ],
            ],
          ],
        },
      ])
    ).toEqual([11, 43, 13, 45])
  })

  it("gives null without positions", () => {
    expect(geometryBounds([])).toBeNull()
    expect(geometryBounds({ type: "GeometryCollection", geometries: [] })).toBeNull()
  })
})
