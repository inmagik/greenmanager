import { TbBooks } from "react-icons/tb"
import { CATALOGS } from "./definitions"

// Every member reads the catalogs: no permission on the items.
export function contributeToMenu() {
  return [
    {
      id: "catalogs",
      label: "Catalogs",
      path: "/catalogs",
      parent: null,
      icon: TbBooks,
      priority: 200,
    },
    ...Object.values(CATALOGS).map((catalog, index) => ({
      id: `catalogs:${catalog.slug}`,
      label: catalog.key,
      path: `/catalogs/${catalog.slug}`,
      parent: "catalogs",
      icon: catalog.icon,
      priority: (index + 1) * 10,
    })),
  ]
}
