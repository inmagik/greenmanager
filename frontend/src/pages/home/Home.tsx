import { useAuth } from "@/auth/auth"
import { useTenant } from "@/hooks/useTenant"
import { Box, Group, Paper, ScrollArea, Stack, Text, Title } from "@mantine/core"
import { TbBuildingCommunity } from "react-icons/tb"
import { useTranslation } from "react-i18next"
import classes from "./Home.module.css"

export function Home() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const { t } = useTranslation()
  const firstName = user?.full_name?.split(" ")[0]

  return (
    <Box className={classes.page}>
      <ScrollArea h="100%">
        <Box className={classes.content}>
          <Stack gap="lg">
            <Stack gap="xs">
              <Title order={1}>{t("home.welcome", { name: firstName ? `, ${firstName}` : "" })}</Title>
              <Text size="lg" c="dimmed" maw={650}>
                {t("home.intro")}
              </Text>
            </Stack>
            <Paper withBorder radius="md" p="md" maw={420}>
              <Group gap="sm" wrap="nowrap">
                <TbBuildingCommunity size={24} />
                <Box>
                  <Text size="xs" c="dimmed">
                    {t("home.organization")}
                  </Text>
                  <Text fw={600}>{tenant?.name ?? t("home.noOrganization")}</Text>
                </Box>
              </Group>
            </Paper>
          </Stack>
        </Box>
      </ScrollArea>
    </Box>
  )
}
