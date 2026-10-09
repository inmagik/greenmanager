import { Table as TableImpl } from "./Table"
import type {
  TableBodyConfigProps,
  TableColumnProps,
  TableExpansionProps,
  TableExtraAfterContentProps,
  TableExtraBeforeContentProps,
  TableFooterLeftProps,
  TableHeaderConfigProps,
  TableProps,
  TableSelectionProps,
} from "./types"

/* eslint-disable @typescript-eslint/no-unused-vars */
export function createTable<T>() {
  function Table(_props: TableProps<T>) {
    return <TableImpl {..._props} />
  }

  function TableColumn(_props: TableColumnProps<T>) {
    return null
  }
  TableColumn.magikID = "TableColumn"

  function TableExtraAfterContent(_props: TableExtraAfterContentProps) {
    return null
  }
  TableExtraAfterContent.magikID = "TableExtraAfterContent"

  function TableExtraBeforeContent(_props: TableExtraBeforeContentProps) {
    return null
  }
  TableExtraBeforeContent.magikID = "TableExtraBeforeContent"

  function TableHeaderConfig(_props: TableHeaderConfigProps) {
    return null
  }
  TableHeaderConfig.magikID = "TableHeaderConfig"

  function TableBodyConfig(_props: TableBodyConfigProps) {
    return null
  }
  TableBodyConfig.magikID = "TableBodyConfig"

  function TableSelection<S extends keyof T>(_props: TableSelectionProps<T, S>) {
    return null
  }
  TableSelection.magikID = "TableSelection"

  function TableFooterLeft(_props: TableFooterLeftProps) {
    return null
  }
  TableFooterLeft.magikID = "TableFooterLeft"

  function TableFooterCenter(_props: TableFooterLeftProps) {
    return null
  }
  TableFooterCenter.magikID = "TableFooterCenter"

  function TableFooterRight(_props: TableFooterLeftProps) {
    return null
  }
  TableFooterRight.magikID = "TableFooterRight"

  function TableExpansion<S extends keyof T>(_props: TableExpansionProps<T, S>) {
    return null
  }
  TableExpansion.magikID = "TableExpansion"

  Table.Column = TableColumn
  Table.Extra = {
    BeforeContent: TableExtraBeforeContent,
    AfterContent: TableExtraAfterContent,
  }
  Table.Selection = TableSelection
  Table.HeaderConfig = TableHeaderConfig
  Table.BodyConfig = TableBodyConfig
  Table.Footer = {
    Left: TableFooterLeft,
    Center: TableFooterCenter,
    Right: TableFooterRight,
  }
  Table.Expansion = TableExpansion
  return Table
}
