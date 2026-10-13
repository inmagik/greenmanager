import { BlockNavigation } from "@/components/BlockNavigation"
import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { QueryErrorPage } from "@/components/StatusPage"
import { WarningsAlert } from "@/components/WarningsAlert"
import { useHasPermission } from "@/hooks/useHasPermission"
import { AreaElementsPanel } from "@/modules/inventory/components/AreaElementsPanel"
import { INVENTORY_PERMISSIONS } from "@/modules/inventory/permissions"
import { mapLink } from "@/modules/map/links"
import { lastEditDetails } from "@/utils/tracking"
import { Badge, Box, Button, Center, Group, Loader, ScrollArea, Tabs, Text } from "@mantine/core"
import dayjs from "dayjs"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbClipboardList, TbHistory, TbListTree, TbMap, TbPencil, TbPolygon } from "react-icons/tb"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useArea, useUpdateArea } from "../api/areas"
import { AreaContextActions } from "../components/AreaContextActions"
import { AreaForm } from "../components/AreaForm"
import { AreaGeometryPanel } from "../components/AreaGeometryPanel"
import { areaLabel, openAreaHistory } from "../components/areaModals"
import { TERRITORY_PERMISSIONS } from "../permissions"

const TABS = ["data", "geometry", "elements"] as const
type Tab = (typeof TABS)[number]

export function AreaDetail() {
  const { t } = useTranslation()
  const { id, tab } = useParams<{ id: string; tab?: string }>()
  const navigate = useNavigate()
  // The elements of the area, for those who read them.
  const canReadElements = useHasPermission(INVENTORY_PERMISSIONS.READ_ELEMENTS)
  const tabs: readonly Tab[] = canReadElements ? TABS : TABS.filter((name) => name !== "elements")
  const activeTab: Tab = tabs.includes(tab as Tab) ? (tab as Tab) : "data"
  // The tab being edited: leaving it (after the confirmation of BlockNavigation) ends the editing.
  const [editingTab, setEditingTab] = useState<Tab | null>(null)
  if (editingTab && editingTab !== activeTab) setEditingTab(null)
  const editable = editingTab === activeTab
  const { data: area, error, refetch, isFetching } = useArea(id)
  const { mutateAsync: updateArea } = useUpdateArea()

  if (error) return <QueryErrorPage error={error} />
  if (!area) {
    return (
      <Page>
        <Center p="xl">
          <Loader />
        </Center>
      </Page>
    )
  }
  const name = areaLabel(area)
  const ended = !!area.management_end && dayjs(area.management_end).isBefore(dayjs(), "day")

  return (
    <Page>
      <Header
        icon={<TbPolygon size="1.5rem" />}
        title={name}
        extraItems={
          <>
            {area.is_fictitious && <Badge color="gray">{t("territory.fictitious")}</Badge>}
            {ended && <Badge color="gray">{t("territory.managementEnded")}</Badge>}
          </>
        }
        breadcrumbs={[
          { label: t("territory.areas"), href: "/territory/areas" },
          { label: name, href: "#" },
        ]}
        lastEditDetails={lastEditDetails(area)}
        actions={
          <>
            <Button
              variant="default"
              leftSection={<TbMap />}
              component={Link}
              to={mapLink({ client: area.client, area: area.id })}
            >
              {t("mapView.showOnMap")}
            </Button>
            <Button variant="default" leftSection={<TbHistory />} onClick={() => openAreaHistory(area, t)}>
              {t("history.open")}
            </Button>
            {/* The elements have their own actions, in their tab. */}
            {activeTab !== "elements" && (
              <CheckPermission permission={TERRITORY_PERMISSIONS.WRITE_AREAS}>
                {/* Disabled while the area reloads, after a save: the form must start from the new revision. */}
                <Button
                  leftSection={<TbPencil />}
                  disabled={editable || isFetching}
                  onClick={() => setEditingTab(activeTab)}
                >
                  {t(activeTab === "geometry" ? "territory.geometry.edit" : "common.edit")}
                </Button>
              </CheckPermission>
            )}
            {/* Hidden while editing: its changes would reload the form and drop the edits. */}
            {!editable && (
              <CheckPermission permission={TERRITORY_PERMISSIONS.WRITE_AREAS}>
                <AreaContextActions
                  area={area}
                  inDetail
                  onDelete={() => navigate("/territory/areas", { replace: true })}
                />
              </CheckPermission>
            )}
          </>
        }
      />
      {area.warnings.length > 0 && (
        <Box p="sm" className="standard-border-bottom">
          <WarningsAlert warnings={area.warnings} />
        </Box>
      )}
      <Tabs value={activeTab} onChange={(value) => navigate(`/territory/areas/${area.id}/${value ?? "data"}`)}>
        <Tabs.List grow>
          <Tabs.Tab value="data">
            <Group gap="xxs" justify="center">
              <TbClipboardList />
              <Text size="sm">{t("territory.tabs.data")}</Text>
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="geometry">
            <Group gap="xxs" justify="center">
              <TbPolygon />
              <Text size="sm">{t("territory.tabs.geometry")}</Text>
            </Group>
          </Tabs.Tab>
          {canReadElements && (
            <Tabs.Tab value="elements">
              <Group gap="xxs" justify="center">
                <TbListTree />
                <Text size="sm">{t("territory.tabs.elements")}</Text>
              </Group>
            </Tabs.Tab>
          )}
        </Tabs.List>
        <Tabs.Panel value="data">
          <ScrollArea>
            <AreaForm
              // A new revision (a save, or a reload after a conflict) starts the form again with its values.
              key={area.revision}
              area={area}
              readonly={!editable}
              layout="page"
              onCancel={() => setEditingTab(null)}
              onReload={() => refetch()}
              onSubmit={async (values) => {
                await updateArea({ id: area.id, revision: area.revision, ...values })
                setEditingTab(null)
              }}
            />
          </ScrollArea>
        </Tabs.Panel>
        <Tabs.Panel value="geometry">
          <ScrollArea>
            <AreaGeometryPanel
              key={area.revision}
              area={area}
              editable={editable}
              onDone={() => setEditingTab(null)}
              onReload={() => refetch()}
            />
          </ScrollArea>
        </Tabs.Panel>
        {canReadElements && (
          <Tabs.Panel value="elements">
            {/* Mounted only in its tab: the elements load when they are looked at. */}
            {activeTab === "elements" && <AreaElementsPanel area={area} />}
          </Tabs.Panel>
        )}
      </Tabs>
      <BlockNavigation
        when={editable}
        title={t("territory.unsavedChanges")}
        message={t("territory.unsavedChangesMessage")}
      />
    </Page>
  )
}
