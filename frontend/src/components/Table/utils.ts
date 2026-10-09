/* eslint-disable @typescript-eslint/no-explicit-any */
import { isValidElement } from "react"
import type {
  TableBodyConfigProps,
  TableColumnProps,
  TableExpansionProps,
  TableExtraAfterContentProps,
  TableExtraBeforeContentProps,
  TableFooterLeftProps,
  TableHeaderConfigProps,
  TableSelectionProps,
} from "./types"

export function isNodeATableColumn<T>(node: React.ReactNode): node is React.ReactElement<TableColumnProps<T>> {
  return isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableColumn"
}

export function isNodeATableHeaderConfig(node: React.ReactNode): node is React.ReactElement<TableHeaderConfigProps> {
  return isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableHeaderConfig"
}

export function isNodeATableBodyConfig(node: React.ReactNode): node is React.ReactElement<TableBodyConfigProps> {
  return isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableBodyConfig"
}

export function isNodeATableExtraBeforeContent(
  node: React.ReactNode
): node is React.ReactElement<TableExtraBeforeContentProps> {
  return (
    isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableExtraBeforeContent"
  )
}

export function isNodeATableExtraAfterContent(
  node: React.ReactNode
): node is React.ReactElement<TableExtraAfterContentProps> {
  return (
    isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableExtraAfterContent"
  )
}

export function isNodeATableSelection<T, S extends keyof T>(
  node: React.ReactNode
): node is React.ReactElement<TableSelectionProps<T, S>> {
  return isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableSelection"
}

export function isNodeTableFooterLeft(node: React.ReactNode): node is React.ReactElement<TableFooterLeftProps> {
  return isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableFooterLeft"
}
export function isNodeTableFooterCenter(node: React.ReactNode): node is React.ReactElement<TableFooterLeftProps> {
  return isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableFooterCenter"
}
export function isNodeTableFooterRight(node: React.ReactNode): node is React.ReactElement<TableFooterLeftProps> {
  return isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableFooterRight"
}

export function isNodeATableExpansion<T, S extends keyof T>(
  node: React.ReactNode
): node is React.ReactElement<TableExpansionProps<T, S>> {
  return isValidElement(node) && typeof node.type !== "string" && (node.type as any).magikID === "TableExpansion"
}
