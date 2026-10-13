import type { MultiLineString, MultiPolygon, Polygon } from "geojson"
import { describe, expect, it } from "vitest"
import { geometryParts, mergeParts, partKey, splitParts } from "./multipart"

const square = (x: number, y: number, size = 1): Polygon["coordinates"][number] => [
  [x, y],
  [x + size, y],
  [x + size, y + size],
  [x, y + size],
  [x, y],
]

const twoPolygons: MultiPolygon = {
  type: "MultiPolygon",
  coordinates: [[square(10, 44)], [square(12, 44)]],
}

const withHole: MultiPolygon = {
  type: "MultiPolygon",
  coordinates: [[square(10, 44)], [square(12, 44, 4), square(13, 45)]],
}

describe("geometryParts", () => {
  it("gives the parts of a multipart geometry", () => {
    expect(geometryParts(twoPolygons)).toEqual([
      { type: "Polygon", coordinates: [square(10, 44)] },
      { type: "Polygon", coordinates: [square(12, 44)] },
    ])
  })

  it("gives a simple geometry as one part", () => {
    expect(geometryParts({ type: "Point", coordinates: [11, 44] })).toEqual([{ type: "Point", coordinates: [11, 44] }])
  })

  it("gives no parts without a geometry", () => {
    expect(geometryParts(null)).toEqual([])
  })
})

describe("splitParts", () => {
  it("splits a multipart polygon into editable parts", () => {
    const { editable, locked } = splitParts(twoPolygons, "polygon", 9)
    expect(editable).toHaveLength(2)
    expect(locked).toEqual([])
  })

  it("keeps the polygons with holes apart, as they are", () => {
    const { editable, locked } = splitParts(withHole, "polygon", 9)
    expect(editable).toEqual([{ type: "Polygon", coordinates: [square(10, 44)] }])
    expect(locked).toEqual([{ type: "Polygon", coordinates: withHole.coordinates[1] }])
  })

  it("rounds the coordinates to the precision and drops the elevation", () => {
    const { editable } = splitParts(
      { type: "Point", coordinates: [11.1234567891234, 44.98765432109876, 120] },
      "point",
      9
    )
    expect(editable).toEqual([{ type: "Point", coordinates: [11.123456789, 44.987654321] }])
  })

  it("leaves out the parts of another kind", () => {
    const line: MultiLineString = {
      type: "MultiLineString",
      coordinates: [
        [
          [11, 44],
          [11.1, 44.1],
        ],
      ],
    }
    expect(splitParts(line, "polygon", 9).editable).toEqual([])
  })
})

describe("mergeParts", () => {
  it("joins lines into a multipart line", () => {
    const merged = mergeParts("line", [
      {
        type: "LineString",
        coordinates: [
          [11, 44],
          [11.1, 44.1],
        ],
      },
      {
        type: "LineString",
        coordinates: [
          [12, 44],
          [12.1, 44.1],
        ],
      },
    ])
    expect(merged).toEqual({
      type: "MultiLineString",
      coordinates: [
        [
          [11, 44],
          [11.1, 44.1],
        ],
        [
          [12, 44],
          [12.1, 44.1],
        ],
      ],
    })
  })

  it("makes a single polygon multipart", () => {
    expect(mergeParts("polygon", [{ type: "Polygon", coordinates: [square(10, 44)] }])).toEqual({
      type: "MultiPolygon",
      coordinates: [[square(10, 44)]],
    })
  })

  it("gives the last point", () => {
    expect(
      mergeParts("point", [
        { type: "Point", coordinates: [11, 44] },
        { type: "Point", coordinates: [12, 45] },
      ])
    ).toEqual({ type: "Point", coordinates: [12, 45] })
  })

  it("gives null without parts", () => {
    expect(mergeParts("polygon", [])).toBeNull()
    expect(mergeParts("point", [])).toBeNull()
  })

  it("adds the locked polygons", () => {
    const { editable, locked, originals } = splitParts(withHole, "polygon", 9)
    expect(mergeParts("polygon", editable, { originals, locked })).toEqual(withHole)
  })

  it("gives back the original coordinates of the parts not touched", () => {
    const precise: MultiPolygon = {
      type: "MultiPolygon",
      coordinates: [[square(10.12345678912345, 44.12345678912345)], [square(12.12345678912345, 44.1)]],
    }
    const { editable, originals } = splitParts(precise, "polygon", 9)
    const moved: Polygon = { type: "Polygon", coordinates: [square(12.2, 44.1)] }
    expect(mergeParts("polygon", [editable[0], moved], { originals })).toEqual({
      type: "MultiPolygon",
      coordinates: [precise.coordinates[0], moved.coordinates],
    })
  })

  it("round-trips a geometry through split and merge", () => {
    const { editable, locked, originals } = splitParts(twoPolygons, "polygon", 9)
    expect(mergeParts("polygon", editable, { originals, locked })).toEqual(twoPolygons)
  })
})

describe("partKey", () => {
  it("differs by type and coordinates", () => {
    expect(partKey({ type: "Point", coordinates: [11, 44] })).not.toEqual(
      partKey({ type: "Point", coordinates: [11, 44.000000001] })
    )
  })
})
