import { describe, expect, it } from "vitest"
import { touchesUser } from "./privileges"

// `roles` of `me/` holds the roles of every tenant of the user.
const user = { id: 7, roles: [3, 12] }

describe("touchesUser", () => {
  it("is true for a change to the user", () => {
    expect(touchesUser(user, { userIds: [2, 7] })).toBe(true)
  })

  it("is true for a change to one of their roles", () => {
    expect(touchesUser(user, { roleIds: [12] })).toBe(true)
  })

  it("is false for changes to other users and roles", () => {
    expect(touchesUser(user, { userIds: [2], roleIds: [4] })).toBe(false)
    expect(touchesUser(user, {})).toBe(false)
  })
})
