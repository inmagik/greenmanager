import react from "@vitejs/plugin-react"
import { fileURLToPath } from "url"
import { defineConfig } from "vite"
import { createMenuConfig } from "./plugins/menu.ts"
import { createNavigationConfig } from "./plugins/navigation.ts"

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [react(), createNavigationConfig(), createMenuConfig()],
  build: {
    rolldownOptions: {
      output: {
        // MapLibre and terra-draw in chunks of their own, loaded only by the lazy chunks of the map (D-057, D-058).
        codeSplitting: {
          groups: [
            { name: "maplibre", test: /node_modules[\\/]maplibre-gl[\\/]/ },
            { name: "terra-draw", test: /node_modules[\\/]terra-draw(-maplibre-gl-adapter)?[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: false,
        secure: false,
      },
      // The orthophoto of the Portale Cartografico Nazionale is only on HTTP: through the proxy, as in nginx.conf.template.
      "/wms/pcn": {
        target: "http://wms.pcn.minambiente.it",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wms\/pcn/, "/ogc"),
      },
    },
  },
})
