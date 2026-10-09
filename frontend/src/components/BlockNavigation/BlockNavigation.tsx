import { Button, Group, Modal, Text } from "@mantine/core"
import { useEffect } from "react"
import { useBlocker } from "react-router-dom"

type Props = {
  when: boolean
  title: string
  message: string
  cancelText?: string
  proceedText?: string
}

export function BlockNavigation({ when, title, message, cancelText = "Cancel", proceedText = "Proceed" }: Props) {
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
              {cancelText}
            </Button>
            <Button color="red" onClick={() => blocker.proceed()}>
              {proceedText}
            </Button>
          </Group>
        </Modal>
      ) : null}
    </>
  )
}
