import { fetchApi, useDataFetchingAuth, type ApiError } from "@inmagik/react-crud/dist/crud/utils"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { FeatureCollection, Geometry } from "geojson"

/** The response of a `geojson/` action: `truncated` if there were more features than `GEOJSON_MAX_FEATURES`. */
export type GeoJSONResponse<P> = FeatureCollection<Geometry, P & { id: string }> & { truncated: boolean }

/**
 * The `geojson/` action of a resource, with the filters of its list and the `bbox` of the map. The key starts with
 * the endpoint of the resource, so its writes refresh the map too. While a new box loads, the features of the one
 * before stay.
 */
export function useGeoJSON<P>(endpoint: string, query: Record<string, string | null | undefined>, enabled: boolean) {
  const headers = useDataFetchingAuth()
  return useQuery<GeoJSONResponse<P>, ApiError>({
    queryKey: [endpoint, "geojson", query],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams()
      for (const [name, value] of Object.entries(query)) if (value) params.set(name, value)
      const data: GeoJSONResponse<P> = await fetchApi(`${endpoint}/geojson/?${params}`, { signal, headers })
      // The id also as a property: MapLibre identifies the features by a property (`promoteId`), and drops the ids
      // that are not numbers.
      return {
        ...data,
        features: data.features.map((feature) => ({
          ...feature,
          properties: { ...feature.properties, id: String(feature.id) },
        })),
      }
    },
    enabled,
    placeholderData: keepPreviousData,
  })
}
