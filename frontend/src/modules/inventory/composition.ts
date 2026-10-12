import type { SpeciesSummary } from "./types"

/** A species of the composition in the form; `key` keeps the inputs of a row when another row is removed. */
export type CompositionRow = {
  key: string
  species: string | null
  species_data?: SpeciesSummary
  quantity: number | string
  percentage: number | string
}

let lastRowKey = 0

export function compositionRow(values: Partial<Omit<CompositionRow, "key">> = {}): CompositionRow {
  return { key: `row-${++lastRowKey}`, species: null, quantity: "", percentage: "", ...values }
}

/** The sum of the percentages of the rows. */
export function totalPercentage(rows: Pick<CompositionRow, "percentage">[]) {
  return rows.reduce((sum, row) => sum + (typeof row.percentage === "number" ? row.percentage : 0), 0)
}
