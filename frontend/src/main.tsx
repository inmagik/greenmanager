import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import "@mantine/dropzone/styles.css"
import "@mantine/notifications/styles.css"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import "./i18n"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./mantine_customization.css"

// The date inputs of Mantine parse the typed dates with their format (DD/MM/YYYY) only with this plugin.
dayjs.extend(customParseFormat)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
