import classNames from "classnames"
import { Grid } from "../../utils/Grid"
import S from "../Table.module.css"
import type { TableRowProps } from "../types"

export function TableRow({ children, headers, onClick, className, style }: TableRowProps) {
  return (
    <Grid
      justifyItems="stretch"
      alignItems="stretch"
      rows={["auto"]}
      columns={["subgrid"]}
      data-role="row"
      className={classNames(S.tableRow, className)}
      style={{
        gridColumn: `1 / ${headers.length + 1}`,
        minWidth: "100%",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick?.()
      }}
    >
      {children}
    </Grid>
  )
}
