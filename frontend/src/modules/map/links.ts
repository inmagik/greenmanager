type Target = { client: string } & ({ area: string } | { element: string })

/**
 * The link "show on the map" of a record: the map opens on its client, with the record selected and framed. A
 * module with the map imports only this file, which does not load MapLibre.
 */
export function mapLink(target: Target): string {
  const params = new URLSearchParams(target)
  return `/map?${params}`
}
