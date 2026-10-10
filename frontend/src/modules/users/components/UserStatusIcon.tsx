import { TbAlertTriangle, TbCircleCheck } from "react-icons/tb"

export function UserStatusIcon({ status }: { status: "active" | "inactive" | "locked" }) {
  switch (status) {
    case "active":
      return <TbCircleCheck color="var(--mantine-color-green-7)" />
    case "inactive":
      return <TbAlertTriangle color="var(--mantine-color-yellow-7)" />
    case "locked":
      return <TbAlertTriangle color="var(--mantine-color-red-7)" />
    default:
      return null
  }
}
