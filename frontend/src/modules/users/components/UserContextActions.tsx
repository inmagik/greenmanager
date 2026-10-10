import { useAuth } from "@/auth/auth"
import type { User } from "@/auth/types"
import { notifyApiError, requestConfirmation } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { TbDots, TbPower, TbTrash } from "react-icons/tb"
import { useDeleteUser, useUpdateUser } from "../api/users"
import { useTranslation } from "react-i18next"

type Props = {
  user: User
  onDelete?: () => void
  onDeactivate?: () => void
}

export function UserContextActions({ user, onDelete, onDeactivate }: Props) {
  const { t } = useTranslation()
  const { mutateAsync: updateUser } = useUpdateUser()
  const { mutateAsync: deleteUser } = useDeleteUser()
  // The server refuses to deactivate or delete one's own account.
  const { user: currentUser } = useAuth()
  const isCurrentUser = currentUser?.id === user.id

  return (
    <Menu>
      <Menu.Target>
        <Button
          px="xs"
          variant="subtle"
          color="gray"
          c="gray.7"
          aria-label={t("users.actions.menuFor", { name: user.full_name || user.email })}
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
              t("users.actions.deactivate"),
              <b>{t("users.actions.deactivatePrompt")}</b>,
              t("users.actions.deactivateWarning")
            ).then((confirmed) => {
              if (confirmed) {
                updateUser({ id: user.id, is_active: false })
                  .then(() => onDeactivate?.())
                  .catch((error) => notifyApiError(error))
              }
            })
          }}
          disabled={!user.is_active || isCurrentUser}
        >
          {t("users.actions.deactivate")}
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={<TbTrash />}
          onClick={() => {
            requestConfirmation(
              t("users.actions.delete"),
              <b>{t("users.actions.deletePrompt")}</b>,
              t("users.actions.deleteWarning")
            ).then((confirmed) => {
              if (confirmed) {
                deleteUser(user.id)
                  .then(() => onDelete?.())
                  .catch((error) => notifyApiError(error))
              }
            })
          }}
          disabled={isCurrentUser}
        >
          {t("users.actions.delete")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
