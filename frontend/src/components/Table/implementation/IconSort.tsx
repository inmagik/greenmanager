import { UnstyledButton } from "@mantine/core"
import classNames from "classnames"
import { useTranslation } from "react-i18next"
import { TbArrowsSort, TbSortAscending, TbSortDescending } from "react-icons/tb"
import S from "../Table.module.css"

type Props = {
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
  direction: "asc" | "desc" | null
  onChange?: (direction: "asc" | "desc" | null) => void
  /** Column name for the accessible label of the button. */
  columnLabel: string
}

// A button, so that sorting works from the keyboard; the label says the current direction.
export function IconSort({ direction, onChange, columnLabel, className, style, ...props }: Props) {
  const { t } = useTranslation()
  const Icon = direction === "asc" ? TbSortAscending : direction === "desc" ? TbSortDescending : TbArrowsSort
  const next = direction === null ? "asc" : direction === "asc" ? "desc" : null
  const label =
    direction === "asc"
      ? t("table.sortedAsc", { column: columnLabel })
      : direction === "desc"
        ? t("table.sortedDesc", { column: columnLabel })
        : t("table.sortBy", { column: columnLabel })

  return (
    <UnstyledButton
      className={classNames(S.tableSortIcon, className)}
      style={style}
      aria-label={label}
      onClick={() => {
        onChange?.(next)
      }}
    >
      <Icon size={direction === null ? "1rem" : undefined} {...props} />
    </UnstyledButton>
  )
}
