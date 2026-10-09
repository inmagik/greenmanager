import classNames from "classnames"
import type { CSSProperties } from "react"
import { IconSort } from "./IconSort"
import S from "../Table.module.css"
import { TableCell } from "./TableCell"
import type { TableHeaderProps } from "../types"
import { Flex } from "../../utils/Flex"
import { Grid } from "../../utils/Grid"
import { Checkbox, Text } from "@mantine/core"
import { useTranslation } from "react-i18next"

export function TableHeader<T>({
  headers,
  sticky,
  orderBy,
  orderDirection,
  onOrderChange,
  selectAll,
  allSelected,
  onSelectAll,
  stickyLeftStack,
  ...props
}: TableHeaderProps<T>) {
  const { t } = useTranslation()
  const st: CSSProperties = {
    gridColumn: `1 / ${headers.length + 1}`,
    minWidth: "100%",
  }
  if (sticky) {
    st.position = "sticky"
    st.top = 0
    st.zIndex = 11
  } else {
    st.zIndex = 10
  }
  return (
    <Grid
      justifyItems="stretch"
      alignItems="stretch"
      rows={["auto"]}
      columns={["subgrid"]}
      role="row"
      className={classNames(S.tableHeader)}
      style={st}
      {...props}
    >
      {headers.map((header, index) => {
        const isSortable = header.name !== undefined && header.sortable
        const isOrdered = header.name === orderBy && orderDirection !== undefined && isSortable
        let icon: React.ReactNode = null
        if (header.icon) {
          icon = header.icon
        }
        const title =
          typeof header.title === "string" && header.title.includes(".") ? t(header.title) : header.title
        const columnLabel = typeof title === "string" && title ? title : (header.name ?? "")
        const sortState = isOrdered ? (orderDirection === "desc" ? "descending" : "ascending") : "none"
        let node: React.ReactNode = <Text size="sm">{title}</Text>
        if (header.renderHeader) {
          node = header.renderHeader()
        }
        return (
          <TableCell
            key={index}
            role="columnheader"
            aria-sort={isSortable ? sortState : undefined}
            data-column={header.name ?? ""}
            style={header.headerStyle}
            stickyLeft={header.stickyLeft ? stickyLeftStack[index] : false}
            stickyRight={header.stickyRight}
            className={header.headerClassName}
            justifyContent={header.headerAlign}
          >
            {selectAll && index === 0 && (
              <Flex
                style={{
                  paddingRight: "var(--spacer-3)",
                }}
                justifyContent="center"
                alignItems="center"
              >
                <Checkbox
                  checked={allSelected ?? false}
                  onChange={onSelectAll ?? (() => {})}
                  aria-label={t("table.selectAll")}
                />
              </Flex>
            )}
            {icon}
            {node}
            {isSortable && (
              <IconSort
                onChange={(dir) => {
                  if (dir) {
                    onOrderChange?.(header.name!, dir)
                  } else {
                    onOrderChange?.(null, "asc")
                  }
                }}
                direction={isOrdered ? orderDirection : null}
                columnLabel={columnLabel}
              />
            )}
          </TableCell>
        )
      })}
    </Grid>
  )
}
