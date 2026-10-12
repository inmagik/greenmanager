import { AuthLayout } from "@/auth/AuthLayout"
import { Redirect } from "@/components/Redirect"
import { ScreenWidthGuard } from "@/components/ScreenWidthGuard"
import type { RouteObject } from "react-router-dom"
import { CATALOGS } from "./definitions"
import { CatalogEntriesList } from "./pages/CatalogEntriesList"
import { CatalogEntryDetail } from "./pages/CatalogEntryDetail"

// One list and one detail for every catalog, driven by its definition. The `key` remounts the page when the catalog
// changes, so no state passes from one catalog to another.
export const routes: RouteObject[] = [
  {
    path: "catalogs",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <Redirect to={`/catalogs/${CATALOGS.species.slug}`} />,
      },
      ...Object.values(CATALOGS).map((catalog) => ({
        path: catalog.slug,
        children: [
          {
            index: true,
            element: <CatalogEntriesList key={catalog.slug} catalog={catalog} />,
          },
          {
            path: ":id",
            element: <CatalogEntryDetail key={catalog.slug} catalog={catalog} />,
          },
        ],
      })),
    ],
  },
]
