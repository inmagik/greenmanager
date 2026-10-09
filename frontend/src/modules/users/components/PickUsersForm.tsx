import { Box, Button, Group } from "@mantine/core"
import { useState } from "react"
import type { User } from "@/auth/types"
import { UserMultiSelect } from "./UserMultiSelect"
import { useTranslation } from "react-i18next"

type Props = {
  onSubmit: (values: User[]) => Promise<void> | void
  roleId?: number
}

export function PickUsersForm({ onSubmit, roleId }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const { t } = useTranslation()

  return (
    <Box>
      <Box pb="sm">
        <UserMultiSelect
          label={t("users.fields.selectableUsers")}
          value={users}
          onChange={setUsers}
          placeholder={t("common.selectField", { field: t("users.fields.users").toLocaleLowerCase() })}
          roleId={roleId}
        />
      </Box>
      <Group justify="flex-end" pt="sm">
        <Button
          type="submit"
          disabled={users.length === 0}
          onClick={() => {
            onSubmit(users)
          }}
        >
          {t("common.confirm")}
        </Button>
      </Group>
    </Box>
  )
}
