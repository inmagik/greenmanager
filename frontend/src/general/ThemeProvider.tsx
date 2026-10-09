import { createTheme, MantineProvider, type MantineTheme } from "@mantine/core"
import { DatesProvider } from "@mantine/dates"
import { ModalsProvider } from "@mantine/modals"
import { Notifications } from "@mantine/notifications"
import { useMediaQuery } from "@mantine/hooks"
import "dayjs/locale/it"
import type { ReactNode } from "react"
import { TbX } from "react-icons/tb"
import { useTranslation } from "react-i18next"

const theme = createTheme({
  fontSizes: {
    xxs: "0.625rem", // 10px
  },
  spacing: {
    "3xs": "0.25rem",
    xxs: "0.5rem",
    xs: "0.75rem",
    sm: "1rem",
    md: "1.25rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  colors: {
    default: [
      // scala cyan mantine default color palette
      "#E6F1F5",
      "#BFDDE8",
      "#99C9DB",
      "#72B5CE",
      "#4BA1C1",
      "#248DB4",
      "#1D6F93",
      "#155172",
      "#0E344F",
      "#061A2E"
    ],
  },
  primaryColor: "default",
  primaryShade: 7,
  components: {
    Alert: {
      styles: (theme: MantineTheme) => ({
        root: {
          paddingTop: theme.spacing.xs,
          paddingLeft: theme.spacing.sm,
          paddingBottom: theme.spacing.xs,
          paddingRight: theme.spacing.sm,
        },
      }),
    },
    Select: {
      defaultProps: {
        clearButtonProps: {
          icon: <TbX size="14px" />,
        },
      },
    },
    Tabs: {
      styles: () => ({
        root: {
          display: "flex",
          flexDirection: "column",
          flex: "1 1 0%",
          overflow: "hidden",
        },
        panel: {
          overflow: "hidden",
          flex: "1 1 0%",
          minHeight: 0,
        },
      }),
    },
    ScrollArea: {
      defaultProps: {
        h: "100%",
      },
    },
  },
})

type Props = {
  children: ReactNode
}

export function ThemeProvider({ children }: Props) {
  const isMobile = useMediaQuery("(max-width: 47.99em)")
  const { i18n } = useTranslation()
  // Each supported language needs its dayjs locale imported above.
  const dateLocale = i18n.resolvedLanguage ?? "it"

  return (
    <MantineProvider theme={theme}>
      <Notifications
        position={isMobile ? "bottom-center" : "bottom-right"}
        zIndex={9999}
        autoClose={5000}
      />
      <ModalsProvider modalProps={{ padding: "sm", closeOnClickOutside: false }}>
        <DatesProvider settings={{ locale: dateLocale }}>{children}</DatesProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}
