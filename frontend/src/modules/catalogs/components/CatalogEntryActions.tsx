import { CheckPermission } from "@/components/CheckPermission"
import { notifyApiError, requestConfirmation } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbArchive, TbArchiveOff, TbDots, TbEye, TbEyeOff, TbHistory, TbPencil, TbTrash } from "react-icons/tb"
import type { CatalogDefinition } from "../definitions"
import { useCatalogPermissions } from "../hooks/useCatalogPermissions"
import { CATALOGS_PERMISSIONS } from "../permissions"
import type { CatalogEntry } from "../types"
import { openEntryEdit, openEntryHistory } from "./catalogModals"

type Props = {
  catalog: CatalogDefinition
  entry: CatalogEntry
  /** In the detail page, which has its own buttons for editing and for the history, and checks `WRITE_CATALOGS`. */
  inDetail?: boolean
  onDelete?: () => void
}

/**
 * The actions on an entry: hide and show a system entry, for the organization; retire, restore and delete an entry
 * the user can change. Retiring sends only `retired`: the other data may have changed in the meantime.
 */
export function CatalogEntryActions({ catalog, entry, inDetail = false, onDelete }: Props) {
  const { t } = useTranslation()
  const { canEdit, canHide } = useCatalogPermissions(catalog)
  const { mutateAsync: updateEntry } = catalog.api.useUpdateEntry()
  const { mutateAsync: deleteEntry } = catalog.api.useDeleteEntry()
  const { mutateAsync: hideEntry } = catalog.api.useHideEntry()
  const { mutateAsync: unhideEntry } = catalog.api.useUnhideEntry()
  const editable = canEdit(entry)
  const hideable = canHide(entry)
  if (inDetail && !editable && !hideable) return null

  const confirmThen = async (action: "hide" | "retire" | "delete", run: () => Promise<unknown>, title?: string) => {
    const confirmed = await requestConfirmation(
      t(`catalogs.${action}Title`),
      <b>{t(`catalogs.${action}Heading`, { name: entry.name })}</b>,
      t(`catalogs.${action}Message`)
    )
    if (!confirmed) return
    try {
      await run()
      if (action === "delete") onDelete?.()
    } catch (error) {
      notifyApiError(error, title)
    }
  }

  return (
    <Menu>
      <Menu.Target>
        <Button
          px="xs"
          variant="subtle"
          color="gray"
          c="gray.7"
          aria-label={t("catalogs.actionsFor", { name: entry.name })}
        >
          <TbDots size="1.25rem" />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("catalogs.actions")}</Menu.Label>
        <CheckPermission permission={CATALOGS_PERMISSIONS.WRITE_CATALOGS}>
          {!inDetail && editable && (
            <Menu.Item leftSection={<TbPencil />} onClick={() => openEntryEdit(catalog, entry, t)}>
              {t("common.edit")}
            </Menu.Item>
          )}
        </CheckPermission>
        {!inDetail && (
          <Menu.Item leftSection={<TbHistory />} onClick={() => openEntryHistory(catalog, entry, t)}>
            {t("history.open")}
          </Menu.Item>
        )}
        <CheckPermission permission={CATALOGS_PERMISSIONS.WRITE_CATALOGS}>
          {hideable &&
            (entry.is_hidden ? (
              <Menu.Item
                leftSection={<TbEye />}
                onClick={() => unhideEntry(entry.id).catch((error) => notifyApiError(error))}
              >
                {t("catalogs.unhide")}
              </Menu.Item>
            ) : (
              <Menu.Item leftSection={<TbEyeOff />} onClick={() => confirmThen("hide", () => hideEntry(entry.id))}>
                {t("catalogs.hide")}
              </Menu.Item>
            ))}
          {editable &&
            (entry.retired ? (
              <Menu.Item
                leftSection={<TbArchiveOff />}
                onClick={() => updateEntry({ id: entry.id, retired: false }).catch((error) => notifyApiError(error))}
              >
                {t("catalogs.restore")}
              </Menu.Item>
            ) : (
              <Menu.Item
                leftSection={<TbArchive />}
                onClick={() => confirmThen("retire", () => updateEntry({ id: entry.id, retired: true }))}
              >
                {t("catalogs.retire")}
              </Menu.Item>
            ))}
          {editable && (
            <>
              <Menu.Label>{t("catalogs.dangerZone")}</Menu.Label>
              <Menu.Item
                color="red"
                leftSection={<TbTrash />}
                onClick={() => confirmThen("delete", () => deleteEntry(entry.id), t("catalogs.deleteError"))}
              >
                {t("catalogs.deleteEntry")}
              </Menu.Item>
            </>
          )}
        </CheckPermission>
      </Menu.Dropdown>
    </Menu>
  )
}
