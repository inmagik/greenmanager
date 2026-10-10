import classNames from "classnames"
import classes from "./Page.module.css"
import type { HTMLProps } from "react"

type Props = HTMLProps<HTMLDivElement>

export function Page({ children, className, ...props }: Props) {
  return (
    <div className={classNames(classes.page, className)} {...props}>
      {children}
    </div>
  )
}
