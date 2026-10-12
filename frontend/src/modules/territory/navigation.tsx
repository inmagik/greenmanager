import { AuthLayout } from "@/auth/AuthLayout"
import { CheckPermission } from "@/components/CheckPermission"
import { Redirect } from "@/components/Redirect"
import { ScreenWidthGuard } from "@/components/ScreenWidthGuard"
import { Forbidden } from "@/components/StatusPage"
import { Outlet, type RouteObject } from "react-router-dom"
import { AreaDetail } from "./pages/AreaDetail"
import { AreasList } from "./pages/AreasList"
import { ZoneDetail } from "./pages/ZoneDetail"
import { ZonesList } from "./pages/ZonesList"
import { TERRITORY_PERMISSIONS } from "./permissions"

export const routes: RouteObject[] = [
  {
    path: "territory",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <Redirect to="/territory/areas" />,
      },
      {
        element: (
          <CheckPermission permission={TERRITORY_PERMISSIONS.READ_AREAS} fallback={<Forbidden />}>
            <Outlet />
          </CheckPermission>
        ),
        children: [
          {
            path: "areas",
            children: [
              { index: true, element: <AreasList /> },
              { path: ":id", element: <AreaDetail /> },
              { path: ":id/:tab", element: <AreaDetail /> },
            ],
          },
          {
            path: "zones",
            children: [
              { index: true, element: <ZonesList /> },
              { path: ":id", element: <ZoneDetail /> },
            ],
          },
        ],
      },
    ],
  },
]
