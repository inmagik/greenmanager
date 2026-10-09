import classNames from "classnames"
import { TbArrowsSort, TbSortAscending, TbSortDescending } from "react-icons/tb"
import S from "../Table.module.css"

type Props = {
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
  direction: "asc" | "desc" | null
  onChange?: (direction: "asc" | "desc" | null) => void
}

export function IconSort({ direction, onChange, ...props }: Props) {
  if (direction === null) {
    return (
      <TbArrowsSort
        onClick={() => {
          onChange?.("asc")
        }}
        className={classNames(S.tableSortIcon, "pointer")}
        size="1rem"
        {...props}
      />
    )
  }
  if (direction === "asc") {
    return (
      <TbSortAscending
        onClick={() => {
          onChange?.("desc")
        }}
        className={classNames(S.tableSortIcon, "pointer")}
        {...props}
      />
    )
  }
  if (direction === "desc") {
    return (
      <TbSortDescending
        onClick={() => {
          onChange?.(null)
        }}
        className={classNames(S.tableSortIcon, "pointer")}
        {...props}
      />
    )
  }
}
