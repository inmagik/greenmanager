import { CheckPermission } from "@/components/CheckPermission"
import { notifyApiError, requestConfirmation } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbArchive, TbCalendarEvent, TbDots, TbHistory, TbPencil, TbRestore, TbTrash } from "react-icons/tb"
import { useDeleteElement } from "../api/elements"
import { INVENTORY_PERMISSIONS } from "../permissions"
import type { ElementListItem } from "../types"
import { elementLabel } from "../labels"
import { openElementEdit, openElementHistory, openElementRemoval, openElementRestore } from "./elementModals"

type Props = {
  element: ElementListItem
  /** In the detail page, which has its own buttons for editing and for the history. */
  inDetail?: boolean
  onDelete?: () => void
}

/**
 * The actions of an element: a present element is removed, a removed one has its removal corrected or undone. Only a
 * present element entered by mistake is deleted.
 */
export function ElementContextActions({ element, inDetail = false, onDelete }: Props) {
  const { t } = useTranslation()
  const { mutateAsync: deleteElement } = useDeleteElement()
  const name = elementLabel(element)
  const removed = !!element.removed_on

  return (
    <Menu>
      <Menu.Target>
        <Button px="xs" variant="subtle" color="gray" c="gray.7" aria-label={t("inventory.actionsFor", { name })}>
          <TbDots size="1.25rem" />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("inventory.actions")}</Menu.Label>
        {!inDetail && (
          <>
            <CheckPermission permission={INVENTORY_PERMISSIONS.WRITE_ELEMENTS}>
              <Menu.Item leftSection={<TbPencil />} onClick={() => openElementEdit(element, t)}>
                {t("common.edit")}
              </Menu.Item>
            </CheckPermission>
            <Menu.Item leftSection={<TbHistory />} onClick={() => openElementHistory(element, t)}>
              {t("history.open")}
            </Menu.Item>
          </>
        )}
        <CheckPermission permission={INVENTORY_PERMISSIONS.WRITE_ELEMENTS}>
          <Menu.Label>{t("inventory.lifeCycle")}</Menu.Label>
          {removed ? (
            <>
              <Menu.Item leftSection={<TbCalendarEvent />} onClick={() => openElementRemoval(element, t)}>
                {t("inventory.correctRemoval")}
              </Menu.Item>
              <Menu.Item leftSection={<TbRestore />} onClick={() => openElementRestore(element, t)}>
                {t("inventory.restore")}
              </Menu.Item>
            </>
          ) : (
            <Menu.Item leftSection={<TbArchive />} onClick={() => openElementRemoval(element, t)}>
              {t("inventory.remove")}
            </Menu.Item>
          )}
          {!removed && (
            <>
              <Menu.Label>{t("inventory.dangerZone")}</Menu.Label>
              <Menu.Item
                color="red"
                leftSection={<TbTrash />}
                onClick={async () => {
                  const confirmed = await requestConfirmation(
                    t("inventory.deleteElement"),
                    <b>{t("inventory.deleteElementHeading", { name })}</b>,
                    t("inventory.deleteElementMessage")
                  )
                  if (!confirmed) return
                  try {
                    await deleteElement(element.id)
                    onDelete?.()
                  } catch (error) {
                    notifyApiError(error, t("inventory.deleteElementError"))
                  }
                }}
              >
                {t("inventory.deleteElement")}
              </Menu.Item>
            </>
          )}
        </CheckPermission>
      </Menu.Dropdown>
    </Menu>
  )
}
