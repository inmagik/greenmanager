import type { HTMLProps } from "react"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TableProps<T, _S extends keyof T = never> = Omit<HTMLProps<HTMLDivElement>, "rows" | "columns" | "data"> & {
  data: T[]
  loading?: boolean
  orderBy?: string | null
  orderDirection?: "asc" | "desc"
  onOrderChange?: (orderBy: string | null, orderDirection: "asc" | "desc") => void
  onRowClick?: (row: T, index: number) => void
  getRowStyle?: (row: T, index: number) => React.CSSProperties
}

export type TableColumnProps<T> = {
  title: string
  width?: string
  stickyLeft?: boolean
  stickyRight?: boolean
  name?: string
  render: (arg: T, index: number, columnIndex: number) => React.ReactNode
  renderHeader?: () => React.ReactNode
  headerClassName?: string
  cellClassName?: string
  headerStyle?: React.CSSProperties
  cellStyle?: React.CSSProperties
  headerAlign?: "start" | "center" | "end"
  cellAlign?: "start" | "center" | "end"
  sortable?: boolean
  icon?: React.ReactNode
  /** Hide this column in the compact mobile table. Descriptions and notes are hidden by default. */
  mobileHidden?: boolean
}

export type TableRowProps = {
  headers: TableColumnProps<never>[]
  children: React.ReactNode
  onClick?: () => void
  className: string
  style?: React.CSSProperties
}

export type TableSelectionProps<T, S extends keyof T> = {
  selectionField: S
  selectedRows: T[S][]
  onSelectionChange: (rows: T[S][]) => void
}

export type TableHeaderProps<T> = {
  headers: TableColumnProps<T>[]
  sticky?: boolean
  orderBy?: string
  orderDirection?: "asc" | "desc"
  onOrderChange?: (orderBy: string | null, orderDirection: "asc" | "desc") => void
  selectAll?: boolean
  allSelected?: boolean
  onSelectAll?: () => void
  stickyLeftStack: (number | undefined)[]
}

export type TableHeaderConfigProps = {
  className?: string
  style?: React.CSSProperties
  sticky?: boolean
}

export type TableBodyConfigProps = {
  className?: string
  style?: React.CSSProperties
}

export type TableExtraBeforeContentProps = {
  children: React.ReactNode
  alignToGrid?: boolean
}

export type TableExtraAfterContentProps = {
  children: React.ReactNode
  alignToGrid?: boolean
  sticky?: boolean
}

export type TableFooterLeftProps = {
  children?: React.ReactNode
}

export type TableFooterCenterProps = {
  children?: React.ReactNode
}

export type TableFooterRightProps = {
  children?: React.ReactNode
}

export type TableExpansionProps<T, S extends keyof T> = {
  idField: S
  expandedRows: T[S][]
  render: (arg: T, index: number) => React.ReactNode
}
