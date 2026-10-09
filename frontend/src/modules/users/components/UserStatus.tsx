import { Group, Text } from "@mantine/core"
import { UserStatusIcon } from "./UserStatusIcon"
import { useTranslation } from "react-i18next"

const statuses = {
  active: {
    color: "green.7",
    label: "users.status.active",
  },
  inactive: {
    color: "yellow.7",
    label: "users.status.inactive",
  },
  locked: {
    color: "red.7",
    label: "users.status.locked",
  },
}

export function UserStatus({ status }: { status: "active" | "inactive" | "locked" }) {
  const { t } = useTranslation()
  const { color, label } = statuses[status]
  return (
    <Group gap="xxs" align="center">
      <UserStatusIcon status={status} />
      <Text c={color} fw="500" fz="sm">
        {t(label)}
      </Text>
    </Group>
  )
}
