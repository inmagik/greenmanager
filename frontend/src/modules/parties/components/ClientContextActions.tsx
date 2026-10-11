import { CheckPermission } from "@/components/CheckPermission"
import { notifyApiError, requestConfirmation } from "@/utils"
import { Button, Menu } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbDots, TbHistory, TbPencil, TbPlayerPause, TbPlayerPlay, TbTrash } from "react-icons/tb"
import { useDeleteClient, useUpdateClient } from "../api/clients"
import { PARTIES_PERMISSIONS } from "../permissions"
import type { Client } from "../types"
import { openClientEdit, openClientHistory } from "./clientModals"

type Props = {
  client: Client
  /** In the detail page, which has its own buttons for editing and for the history. */
  inDetail?: boolean
  onDelete?: () => void
}

export function ClientContextActions({ client, inDetail = false, onDelete }: Props) {
  const { t } = useTranslation()
  const { mutateAsync: updateClient } = useUpdateClient()
  const { mutateAsync: deleteClient } = useDeleteClient()

  return (
    <Menu>
      <Menu.Target>
        <Button
          px="xs"
          variant="subtle"
          color="gray"
          c="gray.7"
          aria-label={t("parties.actionsFor", { name: client.name })}
        >
          <TbDots size="1.25rem" />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("parties.actions")}</Menu.Label>
        {!inDetail && (
          <>
            <CheckPermission permission={PARTIES_PERMISSIONS.WRITE_CLIENTS}>
              <Menu.Item leftSection={<TbPencil />} onClick={() => openClientEdit(client, t)}>
                {t("common.edit")}
              </Menu.Item>
            </CheckPermission>
            <Menu.Item leftSection={<TbHistory />} onClick={() => openClientHistory(client, t)}>
              {t("history.open")}
            </Menu.Item>
          </>
        )}
        <CheckPermission permission={PARTIES_PERMISSIONS.WRITE_CLIENTS}>
          {client.active ? (
            <Menu.Item
              leftSection={<TbPlayerPause />}
              onClick={async () => {
                const confirmed = await requestConfirmation(
                  t("parties.deactivateTitle"),
                  <b>{t("parties.deactivateHeading", { name: client.name })}</b>,
                  t("parties.deactivateMessage")
                )
                if (!confirmed) return
                try {
                  // Only `active`: the other data may have changed in the meantime.
                  await updateClient({ id: client.id, active: false })
                } catch (error) {
                  notifyApiError(error)
                }
              }}
            >
              {t("parties.deactivate")}
            </Menu.Item>
          ) : (
            <Menu.Item
              leftSection={<TbPlayerPlay />}
              onClick={() => updateClient({ id: client.id, active: true }).catch((error) => notifyApiError(error))}
            >
              {t("parties.reactivate")}
            </Menu.Item>
          )}
          <Menu.Label>{t("parties.dangerZone")}</Menu.Label>
          <Menu.Item
            color="red"
            leftSection={<TbTrash />}
            onClick={async () => {
              const confirmed = await requestConfirmation(
                t("parties.deleteClient"),
                <b>{t("parties.deleteHeading", { name: client.name })}</b>,
                t("parties.deleteMessage")
              )
              if (!confirmed) return
              try {
                await deleteClient(client.id)
                onDelete?.()
              } catch (error) {
                notifyApiError(error, t("parties.deleteError"))
              }
            }}
          >
            {t("parties.deleteClient")}
          </Menu.Item>
        </CheckPermission>
      </Menu.Dropdown>
    </Menu>
  )
}
