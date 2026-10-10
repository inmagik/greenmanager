import { Text, Title, Tooltip, UnstyledButton } from "@mantine/core"
import { useMemo } from "react"
import { TbLogout } from "react-icons/tb"
import { Link, NavLink, useLocation } from "react-router-dom"
import { getMenuConfig, type MenuItem } from "virtual:menu"
import { requestConfirmation } from "@/utils"
import { useAuth } from "../../auth/auth"
import classes from "./DoubleNavbar.module.css"
import { useTranslation } from "react-i18next"
import { LanguageSelector } from "@/components/LanguageSelector"
import { useTenantUser } from "@/hooks/useHasPermission"
import { supportedLanguages } from "@/i18n"

const hasLanguageChoice = supportedLanguages.length > 1

export function DoubleNavbar() {
  const { user, performLogout } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  const locationPathname = location.pathname

  // The menu shows the sections allowed in the current tenant.
  const tenantUser = useTenantUser()

  const menuConfig = useMemo(() => {
    const config = tenantUser ? getMenuConfig(tenantUser) : []
    const landmarks: MenuItem[] = []
    const links: Record<string, MenuItem[]> = {}
    for (const item of config) {
      if (item.parent === null) {
        landmarks.push(item)
      } else {
        if (!links[item.parent]) {
          links[item.parent] = []
        }
        links[item.parent].push(item)
      }
    }
    landmarks.sort((a, b) => a.priority - b.priority)
    for (const parent in links) {
      links[parent].sort((a, b) => a.priority - b.priority)
    }
    return { landmarks, links }
  }, [tenantUser])

  const labelFor = (item: MenuItem) => t(`navigation.${item.id}`, { defaultValue: item.label })
  const displayName = user?.full_name || user?.email || ""
  const initials = displayName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase()

  const activeLandmark = menuConfig.landmarks.find((link) => {
    const toPathname = link.path
    const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length
    const isActive =
      locationPathname === toPathname ||
      (locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/")
    return isActive
  })

  const mainLinks = menuConfig.landmarks.map((link) => {
    return (
      <Tooltip label={labelFor(link)} position="right" withArrow transitionProps={{ duration: 0 }} key={link.id}>
        <Link
          to={link.path}
          className={classes.mainLink}
          data-active={activeLandmark?.id === link.id}
          aria-label={labelFor(link)}
        >
          <link.icon size={22} />
        </Link>
      </Tooltip>
    )
  })

  const links = activeLandmark
    ? menuConfig.links[activeLandmark.id]?.map((link) => (
        <NavLink className={classes.link} to={link.path} key={link.id}>
          <link.icon size={22} />
          {labelFor(link)}
        </NavLink>
      ))
    : []

  return (
    <nav className={classes.navbar}>
      <div className={`${classes.wrapper} ${classes.desktopNavigation}`}>
        <div className={classes.aside}>
          <Link to="/" className={classes.logo} aria-label={t("navigation.home")}>
            <img src="/logo.svg" alt="" />
          </Link>
          {mainLinks}
          <div style={{ flex: 1 }} />
          <Tooltip label={t("navigation.profile")} position="right" withArrow transitionProps={{ duration: 0 }} key={user?.full_name}>
            <Link to={"/profile"} className={classes.profileLink} aria-label={displayName}>
              <Title order={5}>{initials}</Title>
            </Link>
          </Tooltip>
        </div>
        <div className={classes.main}>
          <Link to="/" className={classes.homeLink}>
            <Title order={4} className={classes.title}>GreenManager</Title>
          </Link>

          <div className={classes.linkgroup}>
            <Text size="sm" fw={700} c="gray.7">
              {activeLandmark ? labelFor(activeLandmark) : undefined}
            </Text>
            {links}
          </div>

          {hasLanguageChoice && (
            <div className={classes.desktopLanguageSelector}>
              <LanguageSelector size="sm" />
            </div>
          )}
        </div>
      </div>
      <div className={classes.mobileNavigation}>
        <div className={classes.mobileSections}>
          {menuConfig.landmarks.map((landmark) => {
            const sectionLinks = menuConfig.links[landmark.id] ?? []
            return (
              <section className={classes.mobileSection} key={landmark.id}>
                <Link
                  to={landmark.path}
                  className={classes.mobileSectionTitle}
                  data-active={activeLandmark?.id === landmark.id}
                >
                  <landmark.icon size={22} />
                  <Text fw={700}>{labelFor(landmark)}</Text>
                </Link>
                {sectionLinks.length > 0 && (
                  <div className={classes.mobileSectionLinks}>
                    {sectionLinks.map((link) => (
                      <NavLink className={classes.mobileLink} to={link.path} key={link.id}>
                        <link.icon size={20} />
                        {labelFor(link)}
                      </NavLink>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
        <Link to="/profile" className={classes.mobileProfileLink}>
          <span className={classes.mobileAvatar}>{initials}</span>
          <span>
            <Text size="sm" fw={700}>{displayName}</Text>
            <Text size="xs" c="dimmed">{t("navigation.profileSettings")}</Text>
          </span>
        </Link>
        <UnstyledButton
          className={classes.mobileLogoutButton}
          onClick={async () => {
            const confirmed = await requestConfirmation(
              t("auth.logoutConfirmTitle"),
              t("auth.logoutConfirmHeading"),
              t("auth.logoutConfirmMessage")
            )
            if (confirmed) performLogout()
          }}
        >
          <TbLogout size={20} />
          <Text size="sm" fw={600}>{t("common.logout")}</Text>
        </UnstyledButton>
        {hasLanguageChoice && (
          <div className={classes.mobileLanguageSelector}>
            <LanguageSelector />
          </div>
        )}
      </div>
    </nav>
  )
}
