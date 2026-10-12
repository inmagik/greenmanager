import { Header } from "@/components/Header"
import { MapView } from "@/components/Map/MapView"
import { Page } from "@/components/Page"
import { useHasPermission } from "@/hooks/useHasPermission"
import { INVENTORY_PERMISSIONS } from "@/modules/inventory/permissions"
import { useClientFilter } from "@/modules/parties/hooks/useClientFilter"
import { TERRITORY_PERMISSIONS } from "@/modules/territory/permissions"
import { useMediaQuery } from "@mantine/hooks"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbMap } from "react-icons/tb"
import { FeaturePanel } from "../components/FeaturePanel"
import { MapContent, type FitTarget } from "../components/MapContent"
import { useMapUrlState } from "../hooks/useMapUrlState"
import classes from "./MapPage.module.css"

// Italy, when the URL has no view and there is nothing to frame.
const ITALY = { center: [12.5, 42.2] as [number, number], zoom: 5 }

/**
 * The map of the areas and of the elements (`/map`), loaded lazily with MapLibre. The state is in the URL; without a
 * view the map frames the selected feature, or the areas of the client.
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

  return (
    <Page>
      <Header
        icon={<TbMap size="1.5rem" />}
        title={t("map.title")}
        breadcrumbs={[{ label: t("map.title"), href: "#" }]}
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
          />
        </MapView>
        <FeaturePanel
          selection={selection}
          mobile={mobile}
          onClose={() => select(null)}
          onFit={() => setFit({ target: "selection", animate: true })}
        />
      </div>
    </Page>
  )
}
