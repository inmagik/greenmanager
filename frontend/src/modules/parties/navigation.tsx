import { AuthLayout } from "@/auth/AuthLayout"
import { CheckPermission } from "@/components/CheckPermission"
import { Redirect } from "@/components/Redirect"
import { ScreenWidthGuard } from "@/components/ScreenWidthGuard"
import { Forbidden } from "@/components/StatusPage"
import { Outlet, type RouteObject } from "react-router-dom"
import { ClientDetail } from "./pages/ClientDetail"
import { ClientsList } from "./pages/ClientsList"
import { PARTIES_PERMISSIONS } from "./permissions"

export const routes: RouteObject[] = [
  {
    path: "parties",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <Redirect to="/parties/clients" />,
      },
      {
        path: "clients",
        element: (
          <CheckPermission permission={PARTIES_PERMISSIONS.READ_CLIENTS} fallback={<Forbidden />}>
            <Outlet />
          </CheckPermission>
        ),
        children: [
          {
            index: true,
            element: <ClientsList />,
          },
          {
            path: ":id",
            element: <ClientDetail />,
          },
        ],
      },
    ],
  },
]
