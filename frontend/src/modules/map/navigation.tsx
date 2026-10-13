import { AuthLayout } from "@/auth/AuthLayout"
import { CheckPermission } from "@/components/CheckPermission"
import { ScreenWidthGuard } from "@/components/ScreenWidthGuard"
import { Forbidden } from "@/components/StatusPage"
import type { RouteObject } from "react-router-dom"
import { LazyMapPage } from "./pages/LazyMapPage"
import { MAP_PERMISSION } from "./permissions"

export const routes: RouteObject[] = [
  {
    path: "map",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <CheckPermission permission={MAP_PERMISSION} fallback={<Forbidden />}>
            <LazyMapPage />
          </CheckPermission>
        ),
      },
    ],
  },
]
