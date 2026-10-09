import { ActionIcon, Anchor, Breadcrumbs, Group, Text, Title, Tooltip } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { TbHelp, TbSlash } from "react-icons/tb"
import { Link } from "react-router-dom"
import classes from "./Header.module.css"

type Props = {
  icon: React.ReactNode
  title: React.ReactNode
  breadcrumbs: { label: string; href: string }[]
  actions?: React.ReactNode
  lastEditDetails?: string
  extraItems?: React.ReactNode
}

export function Header({ icon, title, extraItems, breadcrumbs, actions, lastEditDetails }: Props) {
  const { t } = useTranslation()
  return (
    <header className={classes.header}>
      <div className={classes.headerInner}>
        <div className={classes.headerLhs}>
          <div className={classes.headerIcon}>{icon}</div>
          <div className={classes.headerCopy}>
            <div className={classes.breadcrumbs}>
              <Breadcrumbs separatorMargin="3xs" separator={<TbSlash />}>
                {breadcrumbs.map((breadcrumb, index) => {
                  if (breadcrumb.href === "#") {
                    return (
                      <Text key={index} size={"xs"} lh={1.33}>
                        {breadcrumb.label}
                      </Text>
                    )
                  }
                  return (
                    <Anchor key={index} to={breadcrumb.href} fz={"xs"} lh={1.33} component={Link}>
                      {breadcrumb.label}
                    </Anchor>
                  )
                })}
              </Breadcrumbs>
            </div>
            <Group gap="xs" align="center" wrap="nowrap" className={classes.titleRow}>
              <Title order={3}>{title}</Title>
              {extraItems}
              {lastEditDetails && (
                <Tooltip label={lastEditDetails} multiline withArrow events={{ hover: true, focus: true, touch: true }}>
                  <ActionIcon variant="subtle" color="gray.7" aria-label={t("common.lastEdit")}>
                    <TbHelp size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </div>
        </div>
        {actions && <div className={classes.headerRhs}>{actions}</div>}
      </div>
    </header>
  )
}
