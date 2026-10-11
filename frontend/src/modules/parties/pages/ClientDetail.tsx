import { AlertError } from "@/components/AlertError"
import { BlockNavigation } from "@/components/BlockNavigation"
import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { QueryErrorPage } from "@/components/StatusPage"
import { notifyApiError } from "@/utils"
import { lastEditDetails } from "@/utils/tracking"
import { Badge, Box, Button, Center, Loader, ScrollArea } from "@mantine/core"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbBriefcase, TbHistory, TbPencil } from "react-icons/tb"
import { useNavigate, useParams } from "react-router-dom"
import { useClient, useUpdateClient } from "../api/clients"
import { ClientContextActions } from "../components/ClientContextActions"
import { openClientHistory } from "../components/clientModals"
import { ClientForm } from "../components/ClientForm"
import { PARTIES_PERMISSIONS } from "../permissions"

export function ClientDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editable, setEditable] = useState(false)
  const { data: client, error, refetch, isFetching } = useClient(id)
  const { mutateAsync: updateClient } = useUpdateClient()

  if (error) return <QueryErrorPage error={error} />
  if (!client) {
    return (
      <Page>
        <Center p="xl">
          <Loader />
        </Center>
      </Page>
    )
  }

  return (
    <Page>
      <Header
        icon={<TbBriefcase size="1.5rem" />}
        title={client.name}
        extraItems={!client.active && <Badge color="gray">{t("parties.inactive")}</Badge>}
        breadcrumbs={[
          { label: t("parties.title"), href: "/parties/clients" },
          { label: client.name, href: "#" },
        ]}
        lastEditDetails={lastEditDetails(client)}
        actions={
          <>
            <Button variant="default" leftSection={<TbHistory />} onClick={() => openClientHistory(client, t)}>
              {t("history.open")}
            </Button>
            <CheckPermission permission={PARTIES_PERMISSIONS.WRITE_CLIENTS}>
              {/* Disabled while the client reloads, after a save: the form must start from the new revision. */}
              <Button leftSection={<TbPencil />} disabled={editable || isFetching} onClick={() => setEditable(true)}>
                {t("common.edit")}
              </Button>
            </CheckPermission>
            {/* Hidden while editing: its changes would reload the form and drop the edits. */}
            {!editable && (
              <CheckPermission permission={PARTIES_PERMISSIONS.WRITE_CLIENTS}>
                <ClientContextActions
                  client={client}
                  inDetail
                  onDelete={() => navigate("/parties/clients", { replace: true })}
                />
              </CheckPermission>
            )}
          </>
        }
      />
      <ScrollArea>
        {!editable && !client.active && (
          <Box p="lg" className="standard-border-bottom">
            <AlertError
              variant="warning"
              title={t("parties.inactiveTitle")}
              message={t("parties.inactiveMessage")}
              action={t("parties.reactivate")}
              onAction={() => updateClient({ id: client.id, active: true }).catch((error) => notifyApiError(error))}
              actionPermission={PARTIES_PERMISSIONS.WRITE_CLIENTS}
            />
          </Box>
        )}
        <ClientForm
          // A new revision (a save, or a reload after a conflict) starts the form again with its values.
          key={client.revision}
          initialValues={client}
          readonly={!editable}
          layout="page"
          onCancel={() => setEditable(false)}
          onReload={() => refetch()}
          onSubmit={async (values) => {
            await updateClient({ id: client.id, revision: client.revision, ...values })
            setEditable(false)
          }}
        />
      </ScrollArea>
      <BlockNavigation
        when={editable}
        title={t("parties.unsavedChanges")}
        message={t("parties.unsavedChangesMessage")}
      />
    </Page>
  )
}
