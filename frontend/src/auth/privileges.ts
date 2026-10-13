import type { User } from "./types"

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
