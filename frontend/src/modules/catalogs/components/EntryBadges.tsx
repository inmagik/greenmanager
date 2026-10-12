import { Badge, Group } from "@mantine/core"
import { useTranslation } from "react-i18next"
import type { CatalogEntry } from "../types"

/** Whether the entry is of the system or of the organization. */
export function ScopeBadge({ entry }: { entry: CatalogEntry }) {
  const { t } = useTranslation()
  return (
    <Badge variant="light" color={entry.is_system ? "blue" : "teal"}>
      {t(entry.is_system ? "catalogs.scope.system" : "catalogs.scope.organization")}
    </Badge>
  )
}

/** Whether the organization can pick the entry: retired and hidden entries stay only on the data that use them. */
export function StatusBadge({ entry }: { entry: CatalogEntry }) {
  const { t } = useTranslation()
  if (entry.retired) return <Badge color="gray">{t("catalogs.status.retired")}</Badge>
  if (entry.is_hidden) return <Badge color="orange">{t("catalogs.status.hidden")}</Badge>
  return (
    <Badge variant="light" color="green">
      {t("catalogs.status.available")}
    </Badge>
  )
}

export function EntryBadges({ entry, withScope }: { entry: CatalogEntry; withScope: boolean }) {
  return (
    <Group gap="xs" wrap="nowrap">
      {withScope && <ScopeBadge entry={entry} />}
      <StatusBadge entry={entry} />
    </Group>
  )
}
