import { BlockNavigation } from "@/components/BlockNavigation"
import { CheckPermission } from "@/components/CheckPermission"
import { Header } from "@/components/Header"
import type { DrawControls } from "@/components/Map/draw/GeometryDraw"
import type { PointControls } from "@/components/Map/draw/PointPicker"
import { MapView } from "@/components/Map/MapView"
import { Page } from "@/components/Page"
import { useHasPermission } from "@/hooks/useHasPermission"
import { notifyPositionWarnings } from "@/modules/inventory/components/elementWarnings"
import { INVENTORY_PERMISSIONS } from "@/modules/inventory/permissions"
import type { PositionValue } from "@/modules/inventory/position"
import { useClientFilter } from "@/modules/parties/hooks/useClientFilter"
import { TERRITORY_PERMISSIONS } from "@/modules/territory/permissions"
import { Button } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { modals } from "@mantine/modals"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbMap, TbPlus } from "react-icons/tb"
import { CreateElementPanel } from "../components/CreateElementPanel"
import { FeaturePanel } from "../components/FeaturePanel"
import { MapContent, type FitTarget, type MapDrawing } from "../components/MapContent"
import { DRAWER_SHARE, MapSidePanel } from "../components/MapSidePanel"
import { hasPosition, NEW_ELEMENT, positionPoint, type CreateElementState } from "../createElement"
import { useMapUrlState } from "../hooks/useMapUrlState"
import classes from "./MapPage.module.css"

// On a phone the class and the form of the new element take most of the screen: the map is not used meanwhile.
const FORM_DRAWER_SHARE = 0.85

// Italy, when the URL has no view and there is nothing to frame.
const ITALY = { center: [12.5, 42.2] as [number, number], zoom: 5 }

/**
 * The map of the areas and of the elements (`/map`), loaded lazily with MapLibre. The state is in the URL; without a
 * view the map frames the selected feature, or the areas of the client. "New element" gives a new element its class,
 * its position on the map and its data, in the panel.
 */
export default function MapPage() {
  const { t } = useTranslation()
  const mobile = useMediaQuery("(max-width: 47.99em)", false, { getInitialValueInEffect: false })
  const { view, setView, basemap, setBasemap, layers, setLayers, select, ...state } = useMapUrlState()
  const canReadAreas = useHasPermission(TERRITORY_PERMISSIONS.READ_AREAS)
  const canReadElements = useHasPermission(INVENTORY_PERMISSIONS.READ_ELEMENTS)
  // A feature of a layer the user does not read (e.g. from a shared link) is not selected.
  const selection =
    state.selection && (state.selection.kind === "area" ? canReadAreas : canReadElements) ? state.selection : null
  const [client, selectClient] = useClientFilter()
  const [fit, setFit] = useState<FitTarget>(() => {
    if (view) return null
    if (selection) return { target: "selection", animate: false }
    return client ? { target: "client", animate: false } : null
  })
  const fitted = useCallback(() => setFit(null), [])
  const [creating, setCreating] = useState<CreateElementState | null>(null)
  const [drawControls, setDrawControls] = useState<DrawControls | null>(null)
  const [pointControls, setPointControls] = useState<PointControls | null>(null)

  const setPosition = useCallback(
    (geometry: PositionValue["geometry"]) =>
      setCreating(
        (current) =>
          current && {
            ...current,
            position: { mode: "map", latitude: "", longitude: "", gpsAccuracy: null, geometry },
          }
      ),
    []
  )
  const kind = creating?.step === "position" ? creating.elementClass?.geometry_type : undefined
  const position = creating?.position ?? null
  const drawnGeometry = position?.mode === "map" ? position.geometry : null
  const point = useMemo(() => positionPoint(position), [position])
  const drawing = useMemo<MapDrawing | null>(
    () =>
      kind
        ? {
            kind,
            // Read once by the drawing, e.g. coming back from the form.
            initial: drawnGeometry,
            point,
            onChange: setPosition,
            onDrawControls: setDrawControls,
            onPointControls: setPointControls,
          }
        : null,
    [kind, drawnGeometry, point, setPosition]
  )
  const closeCreation = () => {
    const close = () => {
      setCreating(null)
      setDrawControls(null)
      setPointControls(null)
    }
    if (!hasPosition(creating?.position ?? null)) return close()
    modals.openConfirmModal({
      title: t("map.create.discardTitle"),
      children: t("map.create.discardMessage"),
      labels: { confirm: t("map.create.discard"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: close,
    })
  }

  return (
    <Page>
      <Header
        icon={<TbMap size="1.5rem" />}
        title={t("map.title")}
        breadcrumbs={[{ label: t("map.title"), href: "#" }]}
        actions={
          <CheckPermission permission={INVENTORY_PERMISSIONS.WRITE_ELEMENTS}>
            <Button
              leftSection={<TbPlus />}
              disabled={!!creating}
              onClick={() => {
                select(null)
                setCreating(NEW_ELEMENT)
              }}
            >
              {t("inventory.newElement")}
            </Button>
          </CheckPermission>
        }
      />
      <div className={classes.body}>
        <MapView
          className={classes.map}
          label={t("map.label")}
          initialView={view ?? ITALY}
          basemap={basemap}
          onViewChange={setView}
        >
          <MapContent
            mobile={mobile}
            client={client}
            onClientChange={(value) => {
              selectClient(value)
              if (value) setFit({ target: "client", animate: true })
            }}
            layers={layers}
            onLayersChange={setLayers}
            basemap={basemap}
            onBasemapChange={setBasemap}
            selection={selection}
            onSelect={select}
            fit={fit}
            onFitted={fitted}
            creating={!!creating}
            drawing={drawing}
            // The position of the new element, while the form is open.
            pending={creating && !drawing ? (drawnGeometry ?? point) : null}
          />
        </MapView>
        {creating ? (
          <MapSidePanel
            opened
            mobile={mobile}
            label={t("inventory.newElement")}
            onClose={closeCreation}
            share={creating.step === "position" ? DRAWER_SHARE : FORM_DRAWER_SHARE}
          >
            <CreateElementPanel
              state={creating}
              onChange={setCreating}
              client={client}
              drawControls={drawControls}
              pointControls={pointControls}
              onClose={closeCreation}
              onCreated={(element) => {
                setCreating(null)
                select({ kind: "element", id: element.id })
                notifyPositionWarnings(element.warnings)
              }}
            />
          </MapSidePanel>
        ) : (
          <FeaturePanel
            selection={selection}
            mobile={mobile}
            onClose={() => select(null)}
            onFit={() => setFit({ target: "selection", animate: true })}
          />
        )}
      </div>
      <BlockNavigation
        when={hasPosition(creating?.position ?? null)}
        title={t("map.create.discardTitle")}
        message={t("map.create.discardMessage")}
      />
    </Page>
  )
}
