import type { HTMLProps } from "react"

type Props = {
  justifyContent?: "start" | "end" | "center" | "between" | "around" | "evenly"
  alignItems?: "start" | "end" | "center" | "stretch" | "baseline"
  direction?: "row" | "row-reverse" | "column" | "column-reverse"
  wrap?: "nowrap" | "wrap" | "wrap-reverse"
  gap?: number | string | "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl"
} & HTMLProps<HTMLDivElement>

function convertJustifyContent(value: Props["justifyContent"]) {
  switch (value) {
    case "start":
      return "flex-start"
    case "end":
      return "flex-end"
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

export function Flex({
  justifyContent = "start",
  alignItems = "start",
  direction = "row",
  wrap = "nowrap",
  style,
  children,
  gap,
  ...props
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        justifyContent: convertJustifyContent(justifyContent),
        alignItems: alignItems,
        flexWrap: wrap,
        gap: gap,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
