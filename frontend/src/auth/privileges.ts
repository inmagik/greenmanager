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

type AuthState = {
  user: User | null
  tokens: Tokens | null
  setUser: (user: User) => void
}

/**
 * The refresh behind `useRefreshMe`: if the change touches the current user, reads `me/` with `fetchUser` and
 * replaces the user. `getAuth` gives AuthProvider as it is when called: a confirmation may run after a token refresh.
 * Only the response of the latest request replaces the user, since an older one could carry outdated privileges. On
 * failure the user stays as it was until the next load; the server checks the permissions anyway.
 */
export function makeRefreshMe(fetchUser: (tokens: Tokens) => Promise<User | null>) {
  let lastRequest = 0
  return async (getAuth: () => AuthState, changed: ChangedPrivileges) => {
    const { user, tokens } = getAuth()
    if (!user || !tokens || !touchesUser(user, changed)) {
      return
    }
    const request = ++lastRequest
    try {
      const updatedUser = await fetchUser(tokens)
      if (updatedUser && request === lastRequest) {
        getAuth().setUser(updatedUser)
      }
    } catch {
      // Network error: see above.
    }
  }
}
