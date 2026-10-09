import { AlertError } from "@/components/AlertError"
import { translateApiError } from "@/utils"
import { usePlainList } from "@inmagik/react-crud"
import { Accordion, Badge, Box, Divider, Group, Loader, ScrollArea, Stack, Text } from "@mantine/core"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { TbHistory } from "react-icons/tb"

type AuditLogEntry = {
  id: number
  action: "create" | "update" | "delete" | "access"
  // null for changes made by the system
  actor: string | null
  timestamp: string
  changes: {
    field: string
    old: string | null
    new: string | null
  }[]
}

type Props = {
  endpoint: string
}

export function AuditHistoryModal({ endpoint }: Props) {
  const { t } = useTranslation()
  const { data: entries, isLoading, error } = usePlainList<AuditLogEntry>(endpoint)

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    )
  }

  if (error) {
    return (
      <AlertError title={t("history.loadError")} message={translateApiError(error, t("history.loadErrorMessage"))} />
    )
  }

  if (!entries?.length) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <TbHistory size={32} />
        <Text fw={600}>{t("history.empty")}</Text>
        <Text size="sm" c="dimmed">
          {t("history.emptyDescription")}
        </Text>
      </Stack>
    )
  }

  return (
    <ScrollArea.Autosize mah="65vh">
      <Accordion
        multiple
        variant="separated"
        radius="md"
        styles={{
          item: { marginBottom: 6 },
          control: { padding: "8px 12px" },
          content: { padding: "0 12px 10px" },
          label: { padding: 0 },
        }}
      >
        {entries.map((entry) => (
          <Accordion.Item key={entry.id} value={entry.id.toString()}>
            <Accordion.Control>
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Group gap="xs" wrap="nowrap">
                  <Badge variant="light" size="sm">
                    {t(`history.actions.${entry.action}`, { defaultValue: entry.action })}
                  </Badge>
                  <Box>
                    <Text size="sm" fw={600} lineClamp={1}>
                      {entry.actor ?? t("history.system")}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t("history.changedFields", { count: entry.changes.length })}
                    </Text>
                  </Box>
                </Group>
                <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                  {dayjs(entry.timestamp).format("DD/MM/YYYY HH:mm")}
                </Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              {entry.changes.length === 0 && (
                <Text size="xs" c="dimmed">
                  {t("history.noDetails")}
                </Text>
              )}
              {entry.changes.map((change, index) => (
                <Box key={`${entry.id}-${change.field}`}>
                  {index > 0 && <Divider my={6} />}
                  <Text size="xs" fw={700}>
                    {change.field}
                  </Text>
                  <Group gap={6} wrap="nowrap" align="flex-start">
                    <Text size="xs" c="red.7" td="line-through">
                      {change.old || "—"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      →
                    </Text>
                    <Text size="xs" c="green.7">
                      {change.new || "—"}
                    </Text>
                  </Group>
                </Box>
              ))}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </ScrollArea.Autosize>
  )
}
