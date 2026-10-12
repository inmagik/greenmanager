import i18n from "@/i18n"

// The server gives the measures as decimals in text, in meters on the ellipsoid.
function format(value: string | number, maximumFractionDigits: number) {
  return new Intl.NumberFormat(i18n.language, { maximumFractionDigits }).format(Number(value))
}

/** A surface in square meters, with hectares from one hectare up: "12.345,6 m² (1,23 ha)". */
export function formatSurface(squareMeters: string | number): string {
  const value = Number(squareMeters)
  const meters = i18n.t("geometry.units.squareMeters", { value: format(value, 1) })
  if (value < 10000) return meters
  return `${meters} (${i18n.t("geometry.units.hectares", { value: format(value / 10000, 2) })})`
}

/** A length in meters: "379,9 m". */
export function formatLength(meters: string | number): string {
  return i18n.t("geometry.units.meters", { value: format(meters, 1) })
}
