import { Radio, Stack } from "@mantine/core"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { BASEMAPS, basemapId, basemapLabel, basemapLayerId } from "./basemaps"
import { useMap } from "./MapContext"

type Props = {
  value: string | null
  onChange: (id: string) => void
}

/** The choice of the basemap: it changes the visibility of the basemap layers, never the style of the map. */
export function BasemapSwitcher({ value, onChange }: Props) {
  const { t } = useTranslation()
  const map = useMap()
  const active = basemapId(value)

  useEffect(() => {
    for (const basemap of BASEMAPS) {
      map.setLayoutProperty(basemapLayerId(basemap.id), "visibility", basemap.id === active ? "visible" : "none")
    }
  }, [map, active])

  if (BASEMAPS.length < 2) return null
  return (
    <Radio.Group label={t("mapView.basemap")} value={active} onChange={onChange}>
      <Stack gap="xxs" mt="xxs">
        {BASEMAPS.map((basemap) => (
          <Radio key={basemap.id} size="xs" value={basemap.id} label={basemapLabel(basemap, t)} />
        ))}
      </Stack>
    </Radio.Group>
  )
}
