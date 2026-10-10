import { Pill, Tooltip } from "@mantine/core"

type RoleProps = {
  id: number
  name: string
}

type Props = {
  roles: RoleProps[]
  display?: number
}

export function RolePills({ roles, display }: Props) {
  let displayRoles = roles
  if (display !== undefined) {
    displayRoles = roles.slice(0, display)
  }
  let hiddenRoles: RoleProps[] = []
  if (display !== undefined) {
    hiddenRoles = roles.slice(display)
  }
  const hiddenRolesCount = hiddenRoles.length
  const hiddenRolesStr = hiddenRoles.map((role) => role.name).join("\n")
  const hiddenRolesElement = <span style={{ whiteSpace: "pre" }}>{hiddenRolesStr}</span>

  return (
    <>
      {displayRoles.map((role) => (
        <Pill key={role.id}>{role.name}</Pill>
      ))}
      {hiddenRolesCount > 0 && (
        <Tooltip label={hiddenRolesElement} multiline>
          <Pill ml="3xs">+{hiddenRolesCount}</Pill>
        </Tooltip>
      )}
    </>
  )
}
