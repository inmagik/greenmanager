import { Page } from "@/components/Page"
import { ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { Button, Center, Stack, Text, Title } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbAlertTriangle, TbError404, TbLock } from "react-icons/tb"
import { Link } from "react-router-dom"

type Props = {
  icon: React.ReactNode
  title: string
  description: string
}

function StatusPage({ icon, title, description }: Props) {
  const { t } = useTranslation()
  return (
    <Page>
      <Center flex={1} p="xl">
        <Stack align="center" gap="sm" maw={420} ta="center">
          {icon}
          <Title order={2}>{title}</Title>
          <Text c="dimmed">{description}</Text>
          <Button component={Link} to="/" variant="light" mt="sm">
            {t("notFound.backHome")}
          </Button>
        </Stack>
      </Center>
    </Page>
  )
}

/** Unknown route, or a record that does not exist (or is not visible). */
export function NotFound() {
  const { t } = useTranslation()
  return (
    <StatusPage
      icon={<TbError404 size={48} color="var(--mantine-color-gray-6)" />}
      title={t("notFound.title")}
      description={t("notFound.description")}
    />
  )
}

/** Page that needs a permission the user does not have. */
export function Forbidden() {
  const { t } = useTranslation()
  return (
    <StatusPage
      icon={<TbLock size={48} color="var(--mantine-color-gray-6)" />}
      title={t("forbidden.title")}
      description={t("forbidden.description")}
    />
  )
}

/** Page of a detail whose query failed: not found for a 404, a generic error otherwise. */
export function QueryErrorPage({ error }: { error: unknown }) {
  const { t } = useTranslation()
  if (error instanceof ApiError && error.response.status === 404) {
    return <NotFound />
  }
  return (
    <StatusPage
      icon={<TbAlertTriangle size={48} color="var(--mantine-color-red-7)" />}
      title={t("common.errorTitle")}
      description={t("common.unexpectedError")}
    />
  )
}
