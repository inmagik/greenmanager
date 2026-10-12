import { translateApiError } from "@/utils"
import { Alert, List, Text, type AlertProps } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbAlertTriangle } from "react-icons/tb"

/** A check of the server that does not block the save, translated like the errors (`serverErrors.<code>`). */
export type ServerWarning = {
  code: string
  detail: string
  params?: Record<string, string>
}

type Props = {
  warnings: ServerWarning[]
  title?: string
} & Omit<AlertProps, "color" | "title">

/** The `warnings` of a response of the server: nothing when there are none. */
export function WarningsAlert({ warnings, title, ...props }: Props) {
  const { t } = useTranslation()
  if (!warnings.length) return null
  const messages = warnings.map((warning) => translateApiError(warning, warning.detail))

  return (
    <Alert
      color="yellow"
      icon={<TbAlertTriangle size="1.25rem" />}
      title={
        <Text size="sm" c="yellow.9" fw={600}>
          {title ?? t("warnings.title", { count: warnings.length })}
        </Text>
      }
      {...props}
    >
      {messages.length === 1 ? (
        <Text size="sm">{messages[0]}</Text>
      ) : (
        <List size="sm">
          {messages.map((message, index) => (
            <List.Item key={index}>{message}</List.Item>
          ))}
        </List>
      )}
    </Alert>
  )
}
