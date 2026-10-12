import { CheckPermission } from "@/components/CheckPermission"
import { notifyApiError, requestConfirmation } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbDots, TbHistory, TbPencil, TbTrash } from "react-icons/tb"
import { useDeleteArea } from "../api/areas"
import { TERRITORY_PERMISSIONS } from "../permissions"
import type { AreaListItem } from "../types"
import { areaLabel, openAreaEdit, openAreaHistory } from "./areaModals"

type Props = {
  area: AreaListItem
  /** In the detail page, which has its own buttons for editing and for the history. */
  inDetail?: boolean
  onDelete?: () => void
}

export function AreaContextActions({ area, inDetail = false, onDelete }: Props) {
  const { t } = useTranslation()
  const { mutateAsync: deleteArea } = useDeleteArea()
  const name = areaLabel(area)

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
              <Menu.Item leftSection={<TbPencil />} onClick={() => openAreaEdit(area, t)}>
                {t("common.edit")}
              </Menu.Item>
            </CheckPermission>
            <Menu.Item leftSection={<TbHistory />} onClick={() => openAreaHistory(area, t)}>
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
                t("territory.deleteArea"),
                <b>{t("territory.deleteAreaHeading", { name })}</b>,
                t("territory.deleteAreaMessage")
              )
              if (!confirmed) return
              try {
                await deleteArea(area.id)
                onDelete?.()
              } catch (error) {
                notifyApiError(error, t("territory.deleteAreaError"))
              }
            }}
          >
            {t("territory.deleteArea")}
          </Menu.Item>
        </CheckPermission>
      </Menu.Dropdown>
    </Menu>
  )
}
