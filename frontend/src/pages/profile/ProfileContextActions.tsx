import { useAuth } from "@/auth/auth"
import type { User } from "@/auth/types"
import { Button, Menu } from "@mantine/core"
import { modals } from "@mantine/modals"
import { TbDots, TbLock, TbLogout } from "react-icons/tb"
import { ChangePasswordModal } from "./ChangePasswordModal"
import { useTranslation } from "react-i18next"

type Props = {
  user: User
  onChangePassword?: () => void
  onLogout?: () => void
}

export function ProfileContextActions({ user, onChangePassword, onLogout }: Props) {
  const { performLogout } = useAuth()
  const { t } = useTranslation()

  return (
    <Menu>
      <Menu.Target>
        <Button px="xs" variant="subtle" color="gray" c="gray.7" aria-label={t("profile.actions")}>
          <TbDots size="1.25rem" />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{t("profile.dangerZone")}</Menu.Label>
        <Menu.Item
          color="red"
          leftSection={<TbLock />}
          onClick={() => {
            modals.open({
              title: t("profile.changePassword"),
              size: "md",
              centered: true,

              children: (
                <ChangePasswordModal
                  onChangePassword={() => {
                    modals.closeAll()
                    onChangePassword?.()
                  }}
                />
              ),
            })
          }}
          disabled={!user.is_active}
        >
          {t("profile.changePassword")}
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={<TbLogout />}
          onClick={() => {
            performLogout()
            onLogout?.()
          }}
          disabled={!user.is_active}
        >
          {t("common.logout")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
