import { Button } from "@mantine/core"
import { modals } from "@mantine/modals"
import { TbPlus } from "react-icons/tb"
import { PickUsersForm } from "./PickUsersForm"
import { useGrantRoleToUsers } from "../api/roles"
import { useTranslation } from "react-i18next"
import { notifyApiError } from "@/utils"

type Props = {
  id: number
  refetchUsers: () => void
  setSelection: (users: number[]) => void
}

export default function GrantRoleToUsersAction({ id, refetchUsers, setSelection }: Props) {
  const { t } = useTranslation()
  const { mutateAsync: grantRoleToUsers } = useGrantRoleToUsers(id)
  return (
    <Button
      leftSection={<TbPlus />}
      onClick={() => {
        const modalId = modals.open({
          title: t("roles.detail.assignUsers"),
          children: (
            <PickUsersForm
              onSubmit={(users) => {
                return grantRoleToUsers({ user_ids: users.map((u) => u.id) })
                  .then(() => {
                    modals.close(modalId)
                    setSelection([])
                    refetchUsers()
                  })
                  .catch((error) => notifyApiError(error))
              }}
              roleId={id}
            />
          ),
        })
      }}
    >
      {t("roles.detail.assign")}
    </Button>
  )
}
