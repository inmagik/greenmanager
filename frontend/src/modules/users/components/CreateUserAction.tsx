import { Button } from "@mantine/core"
import { modals } from "@mantine/modals"
import { TbUserPlus } from "react-icons/tb"
import { useNavigate } from "react-router-dom"
import { useCreateUser } from "../api/users"
import { CreateUserForm } from "../components/CreateUserForm"
import { useTranslation } from "react-i18next"

export function CreateUserAction() {
  const { t } = useTranslation()
  const { mutateAsync: createUser } = useCreateUser()
  const navigate = useNavigate()

  return (
    <Button
      leftSection={<TbUserPlus size="1rem" />}
      onClick={() => {
        const modalId = modals.open({
          title: t("users.list.newUser"),
          children: (
            <CreateUserForm
              onSubmit={async (values) => {
                const newUser = await createUser(values)
                modals.close(modalId)
                navigate(`/users/users/${newUser.id}`)
              }}
            />
          ),
        })
      }}
    >
      {t("users.list.newUser")}
    </Button>
  )
}
