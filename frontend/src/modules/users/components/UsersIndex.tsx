import { Redirect } from "@/components/Redirect"
import { useHasPermission } from "@/hooks/useHasPermission"
import { AUTH_CORE_PERMISSIONS } from "../permissions"

/** Index of the section: opens the first page the user can see. */
export function UsersIndex() {
  const canReadUsers = useHasPermission(AUTH_CORE_PERMISSIONS.READ_USERS)
  return <Redirect to={canReadUsers ? "/users/users" : "/users/roles"} />
}
