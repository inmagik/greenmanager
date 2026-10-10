import { ActionIcon, Stack, Text, Tooltip } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbHelp } from "react-icons/tb"
import type { Permission } from "../types"

type Props = {
  permission: Permission
  enablingRole?: { name: string }
}

export function PermissionTooltip({ permission, enablingRole }: Props) {
  const { t } = useTranslation()
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
                  {t("roles.permissionIncludedIn")}{" "}
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
      events={{ hover: true, focus: true, touch: true }}
    >
      {/* A button, so that the tooltip opens from the keyboard too. */}
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        aria-label={t("roles.permissionInfo", { name: permission.name })}
      >
        <TbHelp />
      </ActionIcon>
    </Tooltip>
  )
}
