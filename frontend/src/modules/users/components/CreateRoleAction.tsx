import { Button } from "@mantine/core"
import { modals } from "@mantine/modals"
import { TbVectorBezierCircle } from "react-icons/tb"
import { useNavigate } from "react-router-dom"
import { useCreateRole } from "../api/roles"
import { CreateRoleForm } from "./CreateRoleForm"
import { useTranslation } from "react-i18next"

export function CreateRoleAction() {
  const { t } = useTranslation()
  const { mutateAsync: createRole } = useCreateRole()
  const navigate = useNavigate()

  return (
    <Button
      leftSection={<TbVectorBezierCircle size="1rem" />}
      onClick={() => {
        const modalId = modals.open({
          title: t("roles.list.newRole"),
          children: (
            <CreateRoleForm
              onSubmit={async (values) => {
                const newRole = await createRole(values)
                modals.close(modalId)
                navigate(`/users/roles/${newRole.id}`)
              }}
            />
          ),
        })
      }}
    >
      {t("roles.list.newRole")}
    </Button>
  )
}
