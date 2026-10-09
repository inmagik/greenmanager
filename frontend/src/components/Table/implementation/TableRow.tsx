import classNames from "classnames"
import { Grid } from "../../utils/Grid"
import S from "../Table.module.css"
import type { TableRowProps } from "../types"

// Clicks on these elements keep their own behaviour and do not trigger the row.
const INTERACTIVE_SELECTOR = "a, button, input, label, select, textarea, [role='menuitem'], [role='checkbox']"

export function TableRow({ children, headers, onClick, className, style }: TableRowProps) {
  return (
    <Grid
      justifyItems="stretch"
      alignItems="stretch"
      rows={["auto"]}
      columns={["subgrid"]}
      role="row"
      className={classNames(S.tableRow, className)}
      style={{
        gridColumn: `1 / ${headers.length + 1}`,
        minWidth: "100%",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onClick={
        onClick
          ? (event) => {
              const target = event.target as Element
              // Clicks from portals (menus, modals) bubble here through React, not through the DOM.
              if (!event.currentTarget.contains(target)) return
              const interactive = target.closest(INTERACTIVE_SELECTOR)
              if (interactive && event.currentTarget.contains(interactive)) return
              onClick()
            }
          : undefined
      }
    >
      {children}
    </Grid>
  )
}
