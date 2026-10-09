import { Checkbox, Loader, Text } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import classNames from "classnames"
import { Children, type Key } from "react"
import { useTranslation } from "react-i18next"
import { Flex } from "../utils/Flex"
import { Grid } from "../utils/Grid"
import { TableCell } from "./implementation/TableCell"
import { TableHeader } from "./implementation/TableHeader"
import { TableRow } from "./implementation/TableRow"
import S from "./Table.module.css"
import type { TableExpansionProps, TableProps } from "./types"
import {
  isNodeATableBodyConfig,
  isNodeATableColumn,
  isNodeATableExpansion,
  isNodeATableExtraAfterContent,
  isNodeATableExtraBeforeContent,
  isNodeATableHeaderConfig,
  isNodeATableSelection,
  isNodeTableFooterCenter,
  isNodeTableFooterLeft,
  isNodeTableFooterRight,
} from "./utils"

type OwnProps<T> = TableProps<T>

function defaultSelectionHandler() {}

function defaultRowKey<T>(row: T, index: number): Key {
  const id = (row as { id?: unknown } | null)?.id
  return typeof id === "string" || typeof id === "number" ? id : index
}

export function Table<T>({
  data,
  loading,
  style,
  className,
  orderBy,
  orderDirection,
  onOrderChange,
  onRowClick,
  getRowStyle,
  getRowKey = defaultRowKey,
  ...props
}: OwnProps<T>) {
  const { t } = useTranslation()
  const isMobile = useMediaQuery("(max-width: 47.99em)")
  const childrenArray = Children.toArray(props.children)
  const headers = childrenArray
    .filter(isNodeATableColumn<T>)
    .map((header) => header.props)
    .filter((header) => {
      if (!isMobile) return true
      if (header.mobileHidden !== undefined) return !header.mobileHidden
      return header.name !== "description" && header.name !== "notes"
    })
  const headerConfig = childrenArray.find((child) => isNodeATableHeaderConfig(child))?.props ?? {}
  const bodyConfig = childrenArray.find((child) => isNodeATableBodyConfig(child))?.props ?? {}
  const selectionConfig = childrenArray.find((child) => isNodeATableSelection<T, keyof T>(child))?.props ?? null
  const extraContentBefore = childrenArray
    .filter((child) => isNodeATableExtraBeforeContent(child))
    .map((child) => child.props)
  const extraContentAfter = childrenArray
    .filter((child) => isNodeATableExtraAfterContent(child))
    .map((child) => child.props)
  const footerLeft = childrenArray.find((child) => isNodeTableFooterLeft(child))?.props ?? null
  const footerCenter = childrenArray.find((child) => isNodeTableFooterCenter(child))?.props ?? null
  const footerRight = childrenArray.find((child) => isNodeTableFooterRight(child))?.props ?? null
  const displayFooter = footerLeft || footerCenter || footerRight
  const expansions = childrenArray
    .filter((child) => isNodeATableExpansion(child))
    .map((child) => child.props) as TableExpansionProps<T, keyof T>[]
  const { style: bodyStyle, className: bodyClassName, ...restBodyConfig } = bodyConfig

  const isSelectionEnabled = selectionConfig !== null
  const idField = isSelectionEnabled ? selectionConfig.selectionField : undefined
  const selectedRows = selectionConfig?.selectedRows ?? []
  const onSelectionChange = selectionConfig?.onSelectionChange ?? defaultSelectionHandler

  const allSelected = data.length > 0 && idField && data.every((datum) => selectedRows?.includes(datum[idField]))

  const selectAll = () => {
    if (idField && selectionConfig) {
      if (allSelected) {
        onSelectionChange?.([])
      } else {
        onSelectionChange?.(data.map((datum) => datum[idField]))
      }
    }
  }

  if (isSelectionEnabled) {
    headers.unshift({
      title: "",
      name: "_selection",
      width: "48px",
      stickyLeft: true,
      renderHeader: () => {
        return (
          <Checkbox
            size="xs"
            checked={allSelected ?? false}
            onChange={() => selectAll()}
            aria-label={t("table.selectAll")}
          />
        )
      },
      render: (datum, index) => {
        const selected = idField ? (selectedRows?.includes(datum[idField]) ?? false) : false
        return (
          <Checkbox
            // there is a bug in the checkbox component that makes it stay unchecked even if checked=true
            // so just remount it by changing the key when the selected state changes
            key={selected ? "1" : "0"}
            size="xs"
            checked={selected}
            aria-label={
              selectionConfig.getRowLabel
                ? t("table.selectItem", { name: selectionConfig.getRowLabel(datum) })
                : t("table.selectRow", { index: index + 1 })
            }
            onChange={() => {
              if (selected) {
                onSelectionChange?.(selectedRows?.filter((r) => r !== datum[idField!]) ?? [])
              } else {
                onSelectionChange?.([...(selectedRows ?? []), datum[idField!]])
              }
            }}
          />
        )
      },
    })
  }

  const stickyLeftStack: (number | undefined)[] = []
  let cumulatedStickyWidth = 0
  for (const [i, header] of headers.entries()) {
    const width = header.width ?? "minmax(max-content, 1fr)"
    if (i === 0 && header.stickyLeft) {
      stickyLeftStack.push(0)
      if (/(\d+)px/.test(width)) {
        cumulatedStickyWidth += parseInt(width)
      }
    } else if (header.stickyLeft) {
      stickyLeftStack.push(cumulatedStickyWidth)
      if (/(\d+)px/.test(width)) {
        cumulatedStickyWidth += parseInt(width)
      }
    }
  }

  const bodyLayout = [] as [T, TableExpansionProps<T, keyof T>[], number, number][]
  let acc = 2
  for (const datum of data) {
    const renderExpansions = expansions.filter((exp) => exp.expandedRows.includes(datum[exp.idField]))
    bodyLayout.push([datum, renderExpansions, 1 + renderExpansions.length, acc] as const)
    acc += 1 + renderExpansions.length
  }

  const bodyItems = acc - 2

  return (
    <>
      <Grid
        justifyItems="stretch"
        alignItems="stretch"
        rows={loading ? ["auto", "1fr"] : ["auto"]}
        columns={headers.map((h) => h.width ?? "minmax(max-content, 1fr)")}
        className={classNames(S.table, className)}
        style={{ minWidth: "100%", ...style }}
        role="table"
        aria-busy={loading || undefined}
        {...props}
      >
        <TableHeader<T>
          headers={headers}
          orderBy={orderBy ?? ""}
          orderDirection={orderDirection}
          onOrderChange={onOrderChange}
          stickyLeftStack={stickyLeftStack}
          {...headerConfig}
        />
        {loading && (
          <Flex
            direction="column"
            justifyContent="center"
            alignItems="center"
            className={classNames(S.tableBody, bodyClassName)}
            role="presentation"
            style={{
              minWidth: "100%",
              height: "100%",
              gridColumn: `1 / span ${headers.length + 1}`,
              alignSelf: "center",
              justifySelf: "center",
              ...bodyStyle,
            }}
            {...restBodyConfig}
          >
            <Loader color="default" />
          </Flex>
        )}
        {!loading && (
          <Grid
            rows={["subgrid"]}
            columns={["subgrid"]}
            justifyItems="stretch"
            alignItems="stretch"
            className={classNames(S.tableBody, bodyClassName)}
            role="rowgroup"
            style={{
              minWidth: "100%",
              gridColumn: `1 / span ${headers.length + 1}`,
              gridRow: `2 / span ${1 + bodyItems + extraContentAfter.length + extraContentBefore.length}`,
              ...bodyStyle,
            }}
            {...restBodyConfig}
          >
            {extraContentBefore.map((extra, index) => {
              const childrenArray = Children.toArray(extra.children)
              return (
                <TableRow key={index} headers={headers} className="magik-ui-table-extra-before-row">
                  {extra.alignToGrid &&
                    headers.map((header, index) => {
                      return (
                        <TableCell
                          key={index}
                          style={header.cellStyle}
                          stickyLeft={header.stickyLeft ? stickyLeftStack[index] : false}
                          stickyRight={header.stickyRight}
                          className={header.cellClassName}
                          justifyContent={header.cellAlign}
                        >
                          {childrenArray[index]}
                        </TableCell>
                      )
                    })}
                  {!extra.alignToGrid && (
                    <div
                      role="cell"
                      aria-colspan={headers.length}
                      style={{ gridColumn: `1 / span ${headers.length + 1}` }}
                    >
                      {extra.children}
                    </div>
                  )}
                </TableRow>
              )
            })}
            {bodyLayout.map(([row, renderExpansions, rowSpan, rowStart], index) => {
              return (
                <Grid
                  key={getRowKey(row, index)}
                  rows={["subgrid"]}
                  columns={["subgrid"]}
                  justifyItems="stretch"
                  alignItems="stretch"
                  className={classNames(S.tableRowContext)}
                  role="presentation"
                  style={{
                    minWidth: "100%",
                    gridColumn: `1 / span ${headers.length + 1}`,
                    gridRow: `${rowStart} / span ${rowSpan}`,
                    ...bodyStyle,
                  }}
                  {...restBodyConfig}
                >
                  <TableRow
                    headers={headers}
                    onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                    className={classNames("magik-ui-table-body-row", {
                      [S.withExpansion]: renderExpansions.length > 0,
                    })}
                    style={getRowStyle ? getRowStyle(row, index) : undefined}
                  >
                    {headers.map((header, colIndex) => {
                      let content = header.render(row, index, colIndex)
                      if (typeof content === "string" || typeof content === "number") {
                        content = <Text>{content}</Text>
                      }
                      return (
                        <TableCell
                          key={colIndex}
                          data-column={header.name ?? ""}
                          style={header.cellStyle}
                          stickyLeft={header.stickyLeft ? stickyLeftStack[colIndex] : false}
                          stickyRight={header.stickyRight}
                          className={header.cellClassName}
                          justifyContent={header.cellAlign}
                        >
                          {content}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                  {renderExpansions.map((expansion, expIndex) => {
                    return (
                      <div
                        className={classNames(S.tableExpansion, { [S.last]: expIndex === renderExpansions.length - 1 })}
                        style={{ gridColumn: `1 / span ${headers.length + 1}` }}
                        key={expIndex}
                        role="row"
                      >
                        <div role="cell" aria-colspan={headers.length}>
                          {expansion.render(row, index)}
                        </div>
                      </div>
                    )
                  })}
                </Grid>
              )
            })}
            {extraContentAfter.map((extra, index) => {
              const childrenArray = Children.toArray(extra.children)
              return (
                <TableRow
                  key={index}
                  headers={headers}
                  className="magik-ui-table-extra-after-row"
                  style={extra.sticky ? { position: "sticky", bottom: 0, zIndex: 100 } : {}}
                >
                  {extra.alignToGrid &&
                    headers.map((header, index) => {
                      return (
                        <TableCell
                          key={index}
                          style={header.cellStyle}
                          stickyLeft={header.stickyLeft ? stickyLeftStack[index] : false}
                          stickyRight={header.stickyRight}
                          className={header.cellClassName}
                          justifyContent={header.cellAlign}
                        >
                          {childrenArray[index]}
                        </TableCell>
                      )
                    })}
                  {!extra.alignToGrid && (
                    <div
                      role="cell"
                      aria-colspan={headers.length}
                      style={{ gridColumn: `1 / span ${headers.length + 1}` }}
                    >
                      {extra.children}
                    </div>
                  )}
                </TableRow>
              )
            })}
          </Grid>
        )}
      </Grid>
      {displayFooter && (
        <Grid
          rows={["max-content"]}
          columns={["1fr", "max-content", "1fr"]}
          className={classNames(S.tableFooter)}
          alignItems="center"
          justifyItems="stretch"
        >
          <div className={S.footerLeft}>{footerLeft?.children}</div>
          <div className={S.footerCenter}>{footerCenter?.children}</div>
          <div className={S.footerRight}>{footerRight?.children}</div>
        </Grid>
      )}
    </>
  )
}
