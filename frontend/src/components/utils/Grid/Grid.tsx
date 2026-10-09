import type { HTMLProps } from "react"

export type GridProps = Omit<HTMLProps<HTMLDivElement>, "rows" | "columns"> & {
  justifyContent?: "start" | "end" | "center" | "stretch" | "between" | "around" | "evenly"
  alignContent?: "start" | "end" | "center" | "stretch" | "between" | "around" | "evenly"
  justifyItems?: "start" | "end" | "center" | "stretch"
  alignItems?: "start" | "end" | "center" | "stretch"
  style?: React.CSSProperties
  rowGap?: number | string | "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl"
  columnGap?: number | string | "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl"
  rows: string[]
  columns: string[]
}

function convertJustifyContent(value: GridProps["justifyContent"]) {
  switch (value) {
    case "between":
      return "space-between"
    case "around":
      return "space-around"
    case "evenly":
      return "space-evenly"
    default:
      return value
  }
}

export function Grid({
  justifyContent = "start",
  alignContent = "start",
  justifyItems = "start",
  alignItems = "start",
  style,
  children,
  rowGap = 0,
  columnGap = 0,
  rows,
  columns,
  ...props
}: GridProps) {
  return (
    <div
      style={{
        display: "grid",
        justifyContent: convertJustifyContent(justifyContent),
        alignContent: convertJustifyContent(alignContent),
        justifyItems: justifyItems,
        alignItems: alignItems,
        gridTemplateRows: rows.join(" "),
        gridTemplateColumns: columns.join(" "),
        rowGap: rowGap,
        columnGap: columnGap,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
