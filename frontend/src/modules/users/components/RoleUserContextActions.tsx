import type { User } from "@/auth/types"
import { requestConfirmation } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { TbDots, TbPower } from "react-icons/tb"
import { useUpdateUser } from "../api/users"
import { useTranslation } from "react-i18next"

type Props = {
  user: User
  roleId: number
}

export function RoleUserContextActions({ user, roleId }: Props) {
  const { t } = useTranslation()
  const { mutateAsync: updateUser } = useUpdateUser()

  return (
    <Menu>
      <Menu.Target>
        <Button px="xs" variant="subtle" color="gray" c="gray.7">
          <TbDots size="1.25rem" />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{t("users.actions.dangerZone")}</Menu.Label>
        <Menu.Item
          color="red"
          leftSection={<TbPower />}
          onClick={() => {
            requestConfirmation(
              t("roles.actions.remove"),
              <b>{t("roles.actions.removePrompt")}</b>,
              t("roles.actions.removeWarning")
            ).then((confirmed) => {
              if (confirmed) {
                updateUser({ ...user, roles: user.roles.filter((role) => role !== roleId) })
              }
            })
          }}
        >
          {t("roles.actions.removeButton")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
