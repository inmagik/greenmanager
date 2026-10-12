import { BlockNavigation } from "@/components/BlockNavigation"
import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { QueryErrorPage } from "@/components/StatusPage"
import { lastEditDetails } from "@/utils/tracking"
import { Button, Center, Loader, ScrollArea } from "@mantine/core"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbHistory, TbPencil, TbPolygon, TbStack2 } from "react-icons/tb"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useUpdateZone, useZone } from "../api/zones"
import { ZoneContextActions } from "../components/ZoneContextActions"
import { ZoneForm } from "../components/ZoneForm"
import { openZoneHistory, zoneLabel } from "../components/zoneModals"
import { TERRITORY_PERMISSIONS } from "../permissions"

export function ZoneDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editable, setEditable] = useState(false)
  const { data: zone, error, refetch, isFetching } = useZone(id)
  const { mutateAsync: updateZone } = useUpdateZone()

  if (error) return <QueryErrorPage error={error} />
  if (!zone) {
    return (
      <Page>
        <Center p="xl">
          <Loader />
        </Center>
      </Page>
    )
  }
  const name = zoneLabel(zone)

  return (
    <Page>
      <Header
        icon={<TbStack2 size="1.5rem" />}
        title={name}
        breadcrumbs={[
          { label: t("territory.zones"), href: "/territory/zones" },
          { label: name, href: "#" },
        ]}
        lastEditDetails={lastEditDetails(zone)}
        actions={
          <>
            <Button
              variant="default"
              leftSection={<TbPolygon />}
              component={Link}
              to={`/territory/areas?${new URLSearchParams({ client: zone.client, zone: zone.id })}`}
            >
              {t("territory.zoneAreas")}
            </Button>
            <Button variant="default" leftSection={<TbHistory />} onClick={() => openZoneHistory(zone, t)}>
              {t("history.open")}
            </Button>
            <CheckPermission permission={TERRITORY_PERMISSIONS.WRITE_AREAS}>
              {/* Disabled while the zone reloads, after a save: the form must start from the new revision. */}
              <Button leftSection={<TbPencil />} disabled={editable || isFetching} onClick={() => setEditable(true)}>
                {t("common.edit")}
              </Button>
            </CheckPermission>
            {/* Hidden while editing: its changes would reload the form and drop the edits. */}
            {!editable && (
              <CheckPermission permission={TERRITORY_PERMISSIONS.WRITE_AREAS}>
                <ZoneContextActions
                  zone={zone}
                  inDetail
                  onDelete={() => navigate("/territory/zones", { replace: true })}
                />
              </CheckPermission>
            )}
          </>
        }
      />
      <ScrollArea>
        <ZoneForm
          // A new revision (a save, or a reload after a conflict) starts the form again with its values.
          key={zone.revision}
          zone={zone}
          readonly={!editable}
          layout="page"
          onCancel={() => setEditable(false)}
          onReload={() => refetch()}
          onSubmit={async (values) => {
            await updateZone({ id: zone.id, revision: zone.revision, ...values })
            setEditable(false)
          }}
        />
      </ScrollArea>
      <BlockNavigation
        when={editable}
        title={t("territory.unsavedChanges")}
        message={t("territory.unsavedChangesMessage")}
      />
    </Page>
  )
}
