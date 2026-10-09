import type { User } from "@/auth/types"
import { CheckPermission } from "@/components/CheckPermission"
import { API_URL } from "@/constants"
import { requestConfirmation } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { useQueryClient } from "@tanstack/react-query"
import { TbDots, TbPower } from "react-icons/tb"
import { useRevokeRoleFromUsers } from "../api/roles"
import { AUTH_CORE_PERMISSIONS } from "../permissions"
import { useTranslation } from "react-i18next"

type Props = {
  user: User
  roleId: number
}

export function RoleUserContextActions({ user, roleId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  // Same endpoint as the bulk removal: it needs only the role-write permission.
  const { mutateAsync: revokeRoleFromUsers } = useRevokeRoleFromUsers(roleId)

  return (
    <CheckPermission permission={AUTH_CORE_PERMISSIONS.SCRITTURA_RUOLI}>
      <Menu>
        <Menu.Target>
          <Button
            px="xs"
            variant="subtle"
            color="gray"
            c="gray.7"
            aria-label={t("roles.actions.userMenuFor", { name: user.full_name || user.email })}
          >
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
                  revokeRoleFromUsers({ user_ids: [user.id] }).then(() => {
                    queryClient.invalidateQueries({ queryKey: [`${API_URL}/api/core/auth/users`] })
                    queryClient.invalidateQueries({ queryKey: [`${API_URL}/api/core/auth/roles`] })
                  })
                }
              })
            }}
          >
            {t("roles.actions.removeButton")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </CheckPermission>
  )
}
