import { CheckPermission } from "@/components/CheckPermission"
import { notifyApiError, requestConfirmation } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbDots, TbHistory, TbPencil, TbTrash } from "react-icons/tb"
import { useDeleteZone } from "../api/zones"
import { TERRITORY_PERMISSIONS } from "../permissions"
import type { Zone } from "../types"
import { openZoneEdit, openZoneHistory, zoneLabel } from "./zoneModals"

type Props = {
  zone: Zone
  /** In the detail page, which has its own buttons for editing and for the history. */
  inDetail?: boolean
  onDelete?: () => void
}

export function ZoneContextActions({ zone, inDetail = false, onDelete }: Props) {
  const { t } = useTranslation()
  const { mutateAsync: deleteZone } = useDeleteZone()
  const name = zoneLabel(zone)

  return (
    <Menu>
      <Menu.Target>
        <Button px="xs" variant="subtle" color="gray" c="gray.7" aria-label={t("territory.actionsFor", { name })}>
          <TbDots size="1.25rem" />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("territory.actions")}</Menu.Label>
        {!inDetail && (
          <>
            <CheckPermission permission={TERRITORY_PERMISSIONS.WRITE_AREAS}>
              <Menu.Item leftSection={<TbPencil />} onClick={() => openZoneEdit(zone, t)}>
                {t("common.edit")}
              </Menu.Item>
            </CheckPermission>
            <Menu.Item leftSection={<TbHistory />} onClick={() => openZoneHistory(zone, t)}>
              {t("history.open")}
            </Menu.Item>
          </>
        )}
        <CheckPermission permission={TERRITORY_PERMISSIONS.WRITE_AREAS}>
          <Menu.Label>{t("territory.dangerZone")}</Menu.Label>
          <Menu.Item
            color="red"
            leftSection={<TbTrash />}
            onClick={async () => {
              const confirmed = await requestConfirmation(
                t("territory.deleteZone"),
                <b>{t("territory.deleteZoneHeading", { name })}</b>,
                t("territory.deleteZoneMessage")
              )
              if (!confirmed) return
              try {
                await deleteZone(zone.id)
                onDelete?.()
              } catch (error) {
                notifyApiError(error, t("territory.deleteZoneError"))
              }
            }}
          >
            {t("territory.deleteZone")}
          </Menu.Item>
        </CheckPermission>
      </Menu.Dropdown>
    </Menu>
  )
}
