import { AlertError } from "@/components/AlertError"
import { BlockNavigation } from "@/components/BlockNavigation"
import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { QueryErrorPage } from "@/components/StatusPage"
import { notifyApiError } from "@/utils"
import { lastEditDetails } from "@/utils/tracking"
import { Box, Button, Center, Loader, ScrollArea } from "@mantine/core"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbHistory, TbPencil } from "react-icons/tb"
import { useNavigate, useParams } from "react-router-dom"
import { openEntryHistory } from "../components/catalogModals"
import { CatalogEntryActions } from "../components/CatalogEntryActions"
import { CatalogEntryForm } from "../components/CatalogEntryForm"
import { EntryBadges } from "../components/EntryBadges"
import type { CatalogDefinition } from "../definitions"
import { useCatalogPermissions } from "../hooks/useCatalogPermissions"
import { CATALOGS_PERMISSIONS } from "../permissions"

/** An entry of a catalog: its form, read-only until *Edit*, and its actions. */
export function CatalogEntryDetail({ catalog }: { catalog: CatalogDefinition }) {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editable, setEditable] = useState(false)
  const { data: entry, error, refetch, isFetching } = catalog.api.useEntry(id)
  const { mutateAsync: updateEntry } = catalog.api.useUpdateEntry()
  const { mutateAsync: unhideEntry } = catalog.api.useUnhideEntry()
  const { canEdit, canHide } = useCatalogPermissions(catalog)
  const listPath = `/catalogs/${catalog.slug}`

  if (error) return <QueryErrorPage error={error} />
  if (!entry) {
    return (
      <Page>
        <Center p="xl">
          <Loader />
        </Center>
      </Page>
    )
  }

  const title = t(`catalogs.${catalog.key}.title`)
  return (
    <Page>
      <Header
        icon={<catalog.icon size="1.5rem" />}
        title={entry.name}
        extraItems={<EntryBadges entry={entry} withScope={catalog.extensible} />}
        breadcrumbs={[
          { label: t("catalogs.title"), href: "/catalogs" },
          { label: title, href: listPath },
          { label: entry.name, href: "#" },
        ]}
        lastEditDetails={lastEditDetails(entry)}
        actions={
          <>
            <Button variant="default" leftSection={<TbHistory />} onClick={() => openEntryHistory(catalog, entry, t)}>
              {t("history.open")}
            </Button>
            <CheckPermission permission={CATALOGS_PERMISSIONS.WRITE_CATALOGS}>
              {canEdit(entry) && (
                // Disabled while the entry reloads, after a save: the form must start from the new revision.
                <Button leftSection={<TbPencil />} disabled={editable || isFetching} onClick={() => setEditable(true)}>
                  {t("common.edit")}
                </Button>
              )}
              {/* Hidden while editing: its changes would reload the form and drop the edits. */}
              {!editable && (
                <CatalogEntryActions
                  catalog={catalog}
                  entry={entry}
                  inDetail
                  onDelete={() => navigate(listPath, { replace: true })}
                />
              )}
            </CheckPermission>
          </>
        }
      />
      <ScrollArea>
        {!editable && entry.is_hidden && (
          <Box p="lg" className="standard-border-bottom">
            <AlertError
              variant="warning"
              title={t("catalogs.hiddenTitle")}
              message={t("catalogs.hiddenMessage")}
              action={canHide(entry) ? t("catalogs.unhide") : undefined}
              actionPermission={CATALOGS_PERMISSIONS.WRITE_CATALOGS}
              onAction={() => unhideEntry(entry.id).catch((error) => notifyApiError(error))}
            />
          </Box>
        )}
        {!editable && entry.retired && (
          <Box p="lg" className="standard-border-bottom">
            <AlertError
              variant="warning"
              title={t("catalogs.retiredTitle")}
              message={t("catalogs.retiredMessage")}
              action={canEdit(entry) ? t("catalogs.restore") : undefined}
              actionPermission={CATALOGS_PERMISSIONS.WRITE_CATALOGS}
              onAction={() => updateEntry({ id: entry.id, retired: false }).catch((error) => notifyApiError(error))}
            />
          </Box>
        )}
        <CatalogEntryForm
          // A new revision (a save, or a reload after a conflict) starts the form again with its values.
          key={`${entry.id}:${entry.revision}`}
          catalog={catalog}
          entry={entry}
          readonly={!editable}
          layout="page"
          onCancel={() => setEditable(false)}
          onReload={() => refetch()}
          onSubmit={async (values) => {
            await updateEntry({ id: entry.id, revision: entry.revision, ...values })
            setEditable(false)
          }}
        />
      </ScrollArea>
      <BlockNavigation
        when={editable}
        title={t("catalogs.unsavedChanges")}
        message={t("catalogs.unsavedChangesMessage")}
      />
    </Page>
  )
}
