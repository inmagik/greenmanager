import classNames from "classnames"
import { Flex } from "../../utils/Flex"
import S from "../Table.module.css"

export interface OwnProps {
  children: React.ReactNode
  role?: "cell" | "columnheader"
  "aria-sort"?: "ascending" | "descending" | "none"
  "aria-colspan"?: number
  "data-column"?: string
  stickyLeft?: boolean | number
  stickyRight?: boolean | number
  style?: React.CSSProperties
  justifyContent?: "start" | "center" | "end"
  className?: string
}

export type TableCellProps = OwnProps

export function TableCell({
  children,
  stickyLeft = false,
  stickyRight = false,
  style,
  className,
  justifyContent = "start",
  role = "cell",
  ...props
}: TableCellProps) {
  let st = { ...style }
  if (stickyLeft !== false) {
    st = { ...st, position: "sticky", left: stickyLeft === true ? 0 : stickyLeft, zIndex: 2 }
  } else if (stickyRight !== false) {
    st = { ...st, position: "sticky", right: stickyRight === true ? 0 : stickyRight, zIndex: 2 }
  } else {
    st = { ...st, zIndex: 1 }
  }
  return (
    <Flex
      className={classNames(S.tableCell, className)}
      style={st}
      justifyContent={justifyContent}
      alignItems="center"
      role={role}
      {...props}
    >
      {children}
    </Flex>
  )
}
