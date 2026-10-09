import { Button, Group, Modal, Text } from "@mantine/core"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useBlocker } from "react-router-dom"

type Props = {
  when: boolean
  title: string
  message: string
  cancelText?: string
  proceedText?: string
}

export function BlockNavigation({ when, title, message, cancelText, proceedText }: Props) {
  const { t } = useTranslation()
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname && when
  )

  useEffect(() => {
    if (when) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
      }
      window.addEventListener("beforeunload", handler)
      return () => window.removeEventListener("beforeunload", handler)
    }
  }, [when])

  return (
    <>
      {blocker.state === "blocked" ? (
        <Modal
          opened
          onClose={() => {
            blocker.reset()
          }}
          title={title}
        >
          <Text size="sm">{message}</Text>
          <Group justify="flex-end">
            <Button variant="subtle" color="gray.7" onClick={() => blocker.reset()}>
              {cancelText ?? t("common.cancel")}
            </Button>
            <Button color="red" onClick={() => blocker.proceed()}>
              {proceedText ?? t("common.proceed")}
            </Button>
          </Group>
        </Modal>
      ) : null}
    </>
  )
}
