import { describe, expect, it, vi } from "vitest"
import { makeRefreshMe, touchesUser } from "./privileges"
import type { Tokens, User } from "./types"

// `roles` of `me/` holds the roles of every tenant of the user.
const user = { id: 7, roles: [3, 12] } as User
const tokens: Tokens = { access: "access", refresh: "refresh" }

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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe("makeRefreshMe", () => {
  it("replaces the user with the one read from me/ after a change that touches them", async () => {
    const updated = { ...user, roles: [3] }
    const fetchUser = vi.fn().mockResolvedValue(updated)
    const setUser = vi.fn()

    await makeRefreshMe(fetchUser)(() => ({ user, tokens, setUser }), { roleIds: [12] })

    expect(fetchUser).toHaveBeenCalledWith(tokens)
    expect(setUser).toHaveBeenCalledWith(updated)
  })

  it("does not read me/ after a change to other users and roles", async () => {
    const fetchUser = vi.fn()
    const setUser = vi.fn()

    await makeRefreshMe(fetchUser)(() => ({ user, tokens, setUser }), { userIds: [2], roleIds: [4] })

    expect(fetchUser).not.toHaveBeenCalled()
    expect(setUser).not.toHaveBeenCalled()
  })

  it("uses the tokens of AuthProvider at the time of the call", async () => {
    const auth = { user, tokens, setUser: vi.fn() }
    const fetchUser = vi.fn().mockResolvedValue(user)
    const refreshMe = makeRefreshMe(fetchUser)
    const refreshed = { access: "new access", refresh: "new refresh" }

    auth.tokens = refreshed
    await refreshMe(() => auth, { userIds: [7] })

    expect(fetchUser).toHaveBeenCalledWith(refreshed)
  })

  it("keeps the user when me/ fails", async () => {
    const setUser = vi.fn()
    const auth = () => ({ user, tokens, setUser })

    await makeRefreshMe(vi.fn().mockResolvedValue(null))(auth, { userIds: [7] })
    await expect(makeRefreshMe(vi.fn().mockRejectedValue(new Error("offline")))(auth, { userIds: [7] })).resolves.toBe(
      undefined
    )

    expect(setUser).not.toHaveBeenCalled()
  })

  it("applies only the response of the latest request", async () => {
    const first = deferred<User>()
    const second = deferred<User>()
    const fetchUser = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const setUser = vi.fn()
    const refreshMe = makeRefreshMe(fetchUser)
    const auth = () => ({ user, tokens, setUser })

    const firstRefresh = refreshMe(auth, { userIds: [7] })
    const secondRefresh = refreshMe(auth, { userIds: [7] })
    const latest = { ...user, roles: [] }
    second.resolve(latest)
    await secondRefresh
    first.resolve({ ...user, roles: [3, 12, 20] })
    await firstRefresh

    expect(setUser).toHaveBeenCalledTimes(1)
    expect(setUser).toHaveBeenCalledWith(latest)
  })
})
