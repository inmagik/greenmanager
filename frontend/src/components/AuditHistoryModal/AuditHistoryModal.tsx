import { AlertError } from "@/components/AlertError"
import { translateApiError } from "@/utils"
import { usePlainList } from "@inmagik/react-crud"
import { Accordion, Badge, Box, Divider, Group, Loader, ScrollArea, Stack, Text } from "@mantine/core"
import dayjs from "dayjs"
import { TbHistory } from "react-icons/tb"

type AuditLogEntry = {
  id: number
  action: string
  actor: string
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

const actionLabels: Record<string, string> = {
  create: "Creazione",
  update: "Modifica",
  delete: "Eliminazione",
  access: "Accesso",
}

export function AuditHistoryModal({ endpoint }: Props) {
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
      <AlertError
        title="Impossibile caricare la cronologia"
        message={translateApiError(error, "Si è verificato un errore durante il caricamento.")}
      />
    )
  }

  if (!entries?.length) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <TbHistory size={32} />
        <Text fw={600}>Nessuna modifica registrata</Text>
        <Text size="sm" c="dimmed">
          La cronologia comparirà dopo la prima operazione.
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
                    {actionLabels[entry.action.toLowerCase()] ?? entry.action}
                  </Badge>
                  <Box>
                    <Text size="sm" fw={600} lineClamp={1}>
                      {entry.actor}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {entry.changes.length} {entry.changes.length === 1 ? "campo" : "campi"}
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
                  Nessun dettaglio disponibile.
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
