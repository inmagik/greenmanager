import * as fs from "node:fs"
import * as path from "node:path"

export function createNavigationConfig() {
  const virtualModuleId = 'virtual:routes'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'NavigationConfig', // required, will show up in warnings and errors
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        let imports = ""
        let exports = ""
        const moduleDirs = fs.readdirSync("./src/modules")
        for (const moduleDir of moduleDirs) {
          const navigationFilePath = path.join("./src/modules", moduleDir, "navigation.tsx")
          const navigationImportPath = "@/" + path.relative("./src", navigationFilePath)
          if (!fs.existsSync(navigationFilePath)) {
            continue
          }
          const stat = fs.statSync(navigationFilePath)
          if (stat.isFile()) {
            imports += `import { routes as ${moduleDir}_routes } from "${navigationImportPath}"\n`
            exports += `  ...${moduleDir}_routes,\n`
          }
        }
        return `${imports}\n\nexport const MODULES_ROUTES = [\n${exports}\n]`
      }
    },
  }
}