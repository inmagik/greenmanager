import { describe, expect, it, vi } from "vitest"
import { makeRefreshMe, touchesUser, type AuthState } from "./privileges"
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
  function authState(overrides: Partial<AuthState> = {}): AuthState {
    return { user, tokens, setUser: vi.fn(), ...overrides }
  }

  it("replaces the user with the one read from me/ after a change that touches them", async () => {
    const updated = { ...user, roles: [3] }
    const fetchUser = vi.fn().mockResolvedValue(updated)
    const auth = authState()

    await makeRefreshMe(fetchUser, () => auth)({ roleIds: [12] })

    expect(fetchUser).toHaveBeenCalledWith(tokens)
    expect(auth.setUser).toHaveBeenCalledWith(updated)
  })

  it("does not read me/ after a change to other users and roles", async () => {
    const fetchUser = vi.fn()
    const auth = authState()

    await makeRefreshMe(fetchUser, () => auth)({ userIds: [2], roleIds: [4] })

    expect(fetchUser).not.toHaveBeenCalled()
    expect(auth.setUser).not.toHaveBeenCalled()
  })

  it("uses the tokens of AuthProvider at the time of the call", async () => {
    const auth = authState()
    const fetchUser = vi.fn().mockResolvedValue(user)
    const refreshMe = makeRefreshMe(fetchUser, () => auth)
    const renewed = { access: "new access", refresh: "new refresh" }

    auth.tokens = renewed
    await refreshMe({ userIds: [7] })

    expect(fetchUser).toHaveBeenCalledWith(renewed)
  })

  it("keeps the user when me/ fails", async () => {
    const auth = authState()

    await makeRefreshMe(vi.fn().mockResolvedValue(null), () => auth)({ userIds: [7] })
    await expect(
      makeRefreshMe(vi.fn().mockRejectedValue(new Error("offline")), () => auth)({ userIds: [7] })
    ).resolves.toBe(undefined)

    expect(auth.setUser).not.toHaveBeenCalled()
  })

  it("does not apply a response older than one already applied", async () => {
    const first = deferred<User>()
    const second = deferred<User>()
    const fetchUser = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const auth = authState()
    const refreshMe = makeRefreshMe(fetchUser, () => auth)

    const firstRefresh = refreshMe({ userIds: [7] })
    const secondRefresh = refreshMe({ userIds: [7] })
    const latest = { ...user, roles: [] }
    second.resolve(latest)
    await secondRefresh
    first.resolve({ ...user, roles: [3, 12, 20] })
    await firstRefresh

    expect(auth.setUser).toHaveBeenCalledTimes(1)
    expect(auth.setUser).toHaveBeenCalledWith(latest)
  })

  it("applies an older response when the latest request fails", async () => {
    const first = deferred<User>()
    const fetchUser = vi.fn().mockReturnValueOnce(first.promise).mockRejectedValueOnce(new Error("offline"))
    const auth = authState()
    const refreshMe = makeRefreshMe(fetchUser, () => auth)

    const firstRefresh = refreshMe({ userIds: [7] })
    await refreshMe({ userIds: [7] })
    const older = { ...user, roles: [3] }
    first.resolve(older)
    await firstRefresh

    expect(auth.setUser).toHaveBeenCalledWith(older)
  })

  it("drops the response after a logout", async () => {
    const response = deferred<User>()
    const setUser = vi.fn()
    let auth = authState({ setUser })
    const refreshMe = makeRefreshMe(vi.fn().mockReturnValue(response.promise), () => auth)

    const refresh = refreshMe({ userIds: [7] })
    auth = authState({ user: null, tokens: null, setUser })
    response.resolve(user)
    await refresh

    expect(setUser).not.toHaveBeenCalled()
  })

  it("drops the response after the login of another user", async () => {
    const response = deferred<User>()
    const setUser = vi.fn()
    let auth = authState({ setUser })
    const refreshMe = makeRefreshMe(vi.fn().mockReturnValue(response.promise), () => auth)

    const refresh = refreshMe({ userIds: [7] })
    auth = authState({ user: { ...user, id: 8 }, tokens: { access: "other", refresh: "other" }, setUser })
    response.resolve(user)
    await refresh

    expect(setUser).not.toHaveBeenCalled()
  })
})
