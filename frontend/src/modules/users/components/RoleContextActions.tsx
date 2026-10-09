import { requestConfirmation } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { TbDots, TbPencil, TbTrash } from "react-icons/tb"
import type { Role } from "../types"
import { useDeleteRole } from "../api/roles"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

type Props = {
  role: Role
  onDelete?: () => void
  onDeactivate?: () => void
}

export function RoleContextActions({ role, onDelete }: Props) {
  const { t } = useTranslation()
  const { mutateAsync: deleteRole } = useDeleteRole()

  return (
    <Menu>
      <Menu.Target>
        <Button
          px="xs"
          variant="subtle"
          color="gray"
          c="gray.7"
          aria-label={t("roles.actions.menuFor", { name: role.name })}
        >
          <TbDots size="1.25rem" />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{t("roles.actions.label")}</Menu.Label>
        <Menu.Item leftSection={<TbPencil />} component={Link} to={`/utenti/ruoli/${role.id}`}>
          {t("roles.actions.edit")}
        </Menu.Item>
        <Menu.Label>{t("users.actions.dangerZone")}</Menu.Label>
        <Menu.Item
          color="red"
          leftSection={<TbTrash />}
          onClick={() => {
            requestConfirmation(
              t("roles.actions.delete"),
              <b>{t("roles.actions.deletePrompt")}</b>,
              t("roles.actions.deleteWarning")
            ).then((confirmed) => {
              if (confirmed) {
                deleteRole(role.id).then(() => {
                  onDelete?.()
                })
              }
            })
          }}
        >
          {t("roles.actions.delete")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
