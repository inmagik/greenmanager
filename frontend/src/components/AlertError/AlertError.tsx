import { useHasPermission } from "@/hooks/useHasPermission"
import { Alert, Button, Group, Stack, Text, type AlertProps } from "@mantine/core"
import { TbAlertTriangle } from "react-icons/tb"

type Props = {
  title: string
  message: string
  action?: string
  onAction?: () => void
  variant?: "error" | "warning"
  actionPermission?: string | { allOf: string[] } | { oneOf: string[] }
} & Omit<AlertProps, "color">

export function AlertError({ title, message, action, onAction, actionPermission, variant = "error", ...props }: Props) {
  const hasActionPermission = useHasPermission(actionPermission)
  if (variant === "warning") {
    return (
      <Alert color="yellow" {...props}>
        <Group gap="md" align="center">
          <TbAlertTriangle size="1.25rem" color="var(--mantine-color-yellow-9)" />
          <Stack gap="xxs" flex={1}>
            <Text size="sm" c="yellow.9" fw="600">
              {title}
            </Text>
            <Text size="sm">{message}</Text>
          </Stack>
          {hasActionPermission && !!action && !!onAction && (
            <Button
              variant="subtle"
              color="yellow"
              c="yellow.9"
              onClick={() => {
                onAction()
              }}
            >
              {action}
            </Button>
          )}
        </Group>
      </Alert>
    )
  }
  return (
    <Alert color="red" {...props}>
      <Group gap="md" align="center">
        <TbAlertTriangle size="1.25rem" color="var(--mantine-color-red-9)" />
        <Stack gap="xxs" flex={1}>
          <Text size="sm" c="red.9" fw="600">
            {title}
          </Text>
          <Text size="sm">{message}</Text>
        </Stack>
        {!!action && !!onAction && (
          <Button
            variant="subtle"
            color="red"
            c="red.9"
            onClick={() => {
              onAction()
            }}
          >
            {action}
          </Button>
        )}
      </Group>
    </Alert>
  )
}
