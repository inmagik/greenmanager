import { BlockNavigation } from "@/components/BlockNavigation"
import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import { Page } from "@/components/Page"
import { QueryErrorPage } from "@/components/StatusPage"
import { WarningsAlert } from "@/components/WarningsAlert"
import { lastEditDetails } from "@/utils/tracking"
import { Alert, Badge, Button, Center, Group, Loader, ScrollArea, Stack, Tabs, Text } from "@mantine/core"
import dayjs from "dayjs"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TbClipboardList, TbHistory, TbMapPin, TbPencil, TbRestore, TbTree } from "react-icons/tb"
import { useNavigate, useParams } from "react-router-dom"
import { useElement, useUpdateElement } from "../api/elements"
import { ElementContextActions } from "../components/ElementContextActions"
import { ElementForm } from "../components/ElementForm"
import { elementLabel, openElementHistory, openElementRestore } from "../components/elementModals"
import { ElementPositionPanel } from "../components/ElementPositionPanel"
import { notifyPositionWarnings } from "../components/elementWarnings"
import { INVENTORY_PERMISSIONS } from "../permissions"

const TABS = ["data", "position"] as const
type Tab = (typeof TABS)[number]

export function ElementDetail() {
  const { t } = useTranslation()
  const { id, tab } = useParams<{ id: string; tab?: string }>()
  const navigate = useNavigate()
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "data"
  // The element and the tab being edited: leaving the tab (after the confirmation of BlockNavigation), or going to
  // another element without leaving the page (the link of the replaced element), ends the editing.
  const [editing, setEditing] = useState<{ id: string; tab: Tab } | null>(null)
  if (editing && (editing.id !== id || editing.tab !== activeTab)) setEditing(null)
  const editable = !!editing
  const { data: element, error, refetch, isFetching } = useElement(id)
  const { mutateAsync: updateElement } = useUpdateElement()

  if (error) return <QueryErrorPage error={error} />
  // While another element loads, the one before is not shown.
  if (!element || element.id !== id) {
    return (
      <Page>
        <Center p="xl">
          <Loader />
        </Center>
      </Page>
    )
  }
  const name = elementLabel(element)
  // The forms start again with a new revision (a save, a reload after a conflict) and with another element.
  const formKey = `${element.id}:${element.revision}`

  return (
    <Page>
      <Header
        icon={<TbTree size="1.5rem" />}
        title={name}
        extraItems={
          <>
            {element.removed_on && <Badge color="gray">{t("inventory.removed")}</Badge>}
            {element.location_status === "provisional" && <Badge color="yellow">{t("inventory.provisional")}</Badge>}
          </>
        }
        breadcrumbs={[
          { label: t("inventory.elements"), href: "/inventory/elements" },
          { label: name, href: "#" },
        ]}
        lastEditDetails={lastEditDetails(element)}
        actions={
          <>
            <Button variant="default" leftSection={<TbHistory />} onClick={() => openElementHistory(element, t)}>
              {t("history.open")}
            </Button>
            <CheckPermission permission={INVENTORY_PERMISSIONS.WRITE_ELEMENTS}>
              {/* Disabled while the element reloads, after a save: the form must start from the new revision. */}
              <Button
                leftSection={<TbPencil />}
                disabled={editable || isFetching}
                onClick={() => setEditing({ id: element.id, tab: activeTab })}
              >
                {t(activeTab === "position" ? "inventory.position.change" : "common.edit")}
              </Button>
            </CheckPermission>
            {/* Hidden while editing: its changes would reload the form and drop the edits. */}
            {!editable && (
              <CheckPermission permission={INVENTORY_PERMISSIONS.WRITE_ELEMENTS}>
                <ElementContextActions
                  element={element}
                  inDetail
                  onDelete={() => navigate("/inventory/elements", { replace: true })}
                />
              </CheckPermission>
            )}
          </>
        }
      />
      {(element.removed_on || element.warnings.length > 0) && (
        <Stack gap="xs" p="sm" className="standard-border-bottom">
          {element.removed_on && (
            <Alert
              color="gray"
              title={t("inventory.removedAlert.title", { date: dayjs(element.removed_on).format("DD/MM/YYYY") })}
            >
              <Group justify="space-between" gap="xs">
                <Text size="sm">
                  {element.removal_cause_data
                    ? t("inventory.removedAlert.cause", { cause: element.removal_cause_data.name })
                    : t("inventory.removedAlert.noCause")}
                </Text>
                {!editable && (
                  <CheckPermission permission={INVENTORY_PERMISSIONS.WRITE_ELEMENTS}>
                    <Button
                      size="xs"
                      variant="default"
                      leftSection={<TbRestore />}
                      onClick={() => openElementRestore(element, t)}
                    >
                      {t("inventory.restore")}
                    </Button>
                  </CheckPermission>
                )}
              </Group>
            </Alert>
          )}
          <WarningsAlert warnings={element.warnings} />
        </Stack>
      )}
      <Tabs value={activeTab} onChange={(value) => navigate(`/inventory/elements/${element.id}/${value ?? "data"}`)}>
        <Tabs.List grow>
          <Tabs.Tab value="data">
            <Group gap="xxs" justify="center">
              <TbClipboardList />
              <Text size="sm">{t("inventory.tabs.data")}</Text>
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="position">
            <Group gap="xxs" justify="center">
              <TbMapPin />
              <Text size="sm">{t("inventory.tabs.position")}</Text>
            </Group>
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="data">
          <ScrollArea>
            <ElementForm
              key={formKey}
              element={element}
              readonly={!(editable && activeTab === "data")}
              layout="page"
              onCancel={() => setEditing(null)}
              onReload={() => refetch()}
              onSubmit={async (values) => {
                const saved = await updateElement({ id: element.id, revision: element.revision, ...values })
                setEditing(null)
                // A new class may give a tree a new position, with the trees close to it.
                notifyPositionWarnings(saved.warnings)
              }}
            />
          </ScrollArea>
        </Tabs.Panel>
        <Tabs.Panel value="position">
          <ScrollArea>
            <ElementPositionPanel
              key={formKey}
              element={element}
              editable={editable && activeTab === "position"}
              onDone={() => setEditing(null)}
              onReload={() => refetch()}
            />
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
      <BlockNavigation
        when={editable}
        title={t("inventory.unsavedChanges")}
        message={t("inventory.unsavedChangesMessage")}
      />
    </Page>
  )
}
