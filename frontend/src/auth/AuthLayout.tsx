import { Anchor, AppShell, Burger, Center, Group, Image, Loader, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { Suspense, useEffect } from "react"
import { Link, Navigate, Outlet, useLocation } from "react-router-dom"
import { DoubleNavbar } from "../components/DoubleNavbar"
import { useAuth } from "./auth"
import { TenantSelector } from "@/components/TenantSelector"
import { useTranslation } from "react-i18next"

type AuthLayoutProps = {
  redirect_to: string
}

export function AuthLayout({ redirect_to }: AuthLayoutProps) {
  const auth = useAuth()
  const location = useLocation()
  const { t } = useTranslation()
  const [mobileMenuOpened, { toggle: toggleMobileMenu, close: closeMobileMenu }] = useDisclosure(false)

  useEffect(() => {
    closeMobileMenu()
  }, [location.pathname, closeMobileMenu])

  if (!auth.user) {
    return <Navigate to={redirect_to} replace />
  }

  return (
    <AppShell
      padding="0"
      header={{ height: { base: 60, sm: 0 } }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !mobileMenuOpened, desktop: false },
      }}
    >
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="sm" justify="space-between">
          <Anchor component={Link} to="/" c="inherit" underline="never">
            <Group gap="xs">
              <Image src="/logo.svg" alt="" w={32} h={32} fit="contain" />
              <Text fw={700} fz="lg">GreenManager</Text>
            </Group>
          </Anchor>
          <Burger
            opened={mobileMenuOpened}
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpened ? t("navigation.closeNavigation") : t("navigation.openNavigation")}
          />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar style={{ display: "flex", flexDirection: "column" }}>
        <DoubleNavbar />
        <TenantSelector />
      </AppShell.Navbar>

      <AppShell.Main>
        <Suspense
          fallback={
            <Center h="100%" p="xl">
              <Loader />
            </Center>
          }
        >
          <Outlet />
        </Suspense>
      </AppShell.Main>
    </AppShell>
  )
}
