import { Stack, Text, Tooltip } from "@mantine/core"
import { TbHelp } from "react-icons/tb"
import type { Permission } from "../types"

type Props = {
  permission: Permission
  enablingRole?: { name: string }
}

export function PermissionTooltip({ permission, enablingRole }: Props) {
  return (
    <Tooltip
      label={
        <Stack gap="3xs">
          <Text size="xs">
            <Text fw="bold" span>
              {permission.name}
            </Text>
            <br />
            <Text span>{permission.description}</Text>
            {enablingRole && (
              <>
                <br />
                <br />
                <Text span>
                  This permission is included in the role{" "}
                  <Text span fw="bold" c="yellow.9">
                    {enablingRole.name}
                  </Text>
                </Text>
              </>
            )}
          </Text>
        </Stack>
      }
      withArrow
    >
      <TbHelp color="var(--mantine-color-gray-6)" />
    </Tooltip>
  )
}
