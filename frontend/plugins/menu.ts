import * as fs from "node:fs"
import * as path from "node:path"

export function createMenuConfig() {
  const virtualModuleId = "virtual:menu"
  const resolvedVirtualModuleId = "\0" + virtualModuleId

  return {
    name: "MenuConfig", // required, will show up in warnings and errors
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
          const menuFilePath = path.join("./src/modules", moduleDir, "menu.tsx")
          const menuImportPath = "@/" + path.relative("./src", menuFilePath)
          if (!fs.existsSync(menuFilePath)) {
            continue
          }
          const stat = fs.statSync(menuFilePath)
          if (stat.isFile()) {
            imports += `import { contributeToMenu as ${moduleDir}_menu } from "${menuImportPath}"\n`
            exports += `  ...${moduleDir}_menu(user),\n`
          }
        }
        return `${imports}\n\nexport function getMenuConfig(user) {\n  return [\n${exports}\n  ]\n} `
      }
    },
  }
}
