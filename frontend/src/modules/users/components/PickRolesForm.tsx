import { Box, Button, Group } from "@mantine/core"
import { useState } from "react"
import { RoleMultiSelect } from "./RoleMultiSelect"
import type { Role } from "../types"
import { useTranslation } from "react-i18next"

type Props = {
  onSubmit: (values: Role[]) => Promise<void> | void
}

export function PickRolesForm({ onSubmit }: Props) {
  const [roles, setRoles] = useState<Role[]>([])
  const { t } = useTranslation()

  return (
    <Box>
      <Box pb="sm">
        <RoleMultiSelect
          label={t("users.fields.assignableRoles")}
          value={roles}
          onChange={setRoles}
          placeholder={t("common.selectField", { field: t("users.fields.roles").toLocaleLowerCase() })}
        />
      </Box>
      <Group justify="flex-end" pt="sm">
        <Button type="submit" onClick={() => {
          onSubmit(roles)
        }}>{t("common.confirm")}</Button>
      </Group>
    </Box>
  )
}
