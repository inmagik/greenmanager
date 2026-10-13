import type { Tokens, User } from "./types"

export type ChangedPrivileges = {
  /** Users whose data, roles or permissions changed. */
  userIds?: number[]
  /** Roles whose permissions or users changed, or that were deleted. */
  roleIds?: number[]
}

/** Whether a change to users or roles touches the privileges of `user`: one of `userIds`, or one of their roles. */
export function touchesUser(user: Pick<User, "id" | "roles">, { userIds = [], roleIds = [] }: ChangedPrivileges) {
  return userIds.includes(user.id) || roleIds.some((id) => user.roles.includes(id))
}

export type AuthState = {
  user: User | null
  tokens: Tokens | null
  setUser: (user: User) => void
}

/**
 * The refresh behind `refreshMe`: if the change touches the current user, reads `me/` with `fetchUser` and replaces
 * the user. `getAuth` gives AuthProvider as it is now, both when the refresh starts (the tokens may have been renewed
 * since the change began) and when the response arrives. A response replaces the user only if no newer one has done
 * it already, since it would bring back outdated privileges, and only if the same user is still logged in: after a
 * logout it would bring back the authenticated pages. On failure the user stays as it was until the next load; the
 * server checks the permissions anyway.
 */
export function makeRefreshMe(fetchUser: (tokens: Tokens) => Promise<User | null>, getAuth: () => AuthState) {
  let lastRequest = 0
  let lastApplied = 0
  return async (changed: ChangedPrivileges) => {
    const { user, tokens } = getAuth()
    if (!user || !tokens || !touchesUser(user, changed)) {
      return
    }
    const request = ++lastRequest
    try {
      const updatedUser = await fetchUser(tokens)
      const current = getAuth()
      if (updatedUser && request > lastApplied && current.tokens && current.user?.id === user.id) {
        lastApplied = request
        current.setUser(updatedUser)
      }
    } catch {
      // Network error: see above.
    }
  }
}
