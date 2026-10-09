import { Redirect } from "@/components/Redirect"
import { Outlet, type RouteObject } from "react-router-dom"
import { AuthLayout } from "../../auth/AuthLayout"
import { RolesList } from "./pages/RolesList"
import { UserDetail } from "./pages/UserDetail"
import { UsersList } from "./pages/UsersList"
import { RoleDetail } from "./pages/RoleDetail"
import { CheckPermission } from "@/components/CheckPermission"
import { Forbidden } from "@/components/StatusPage"
import { AUTH_CORE_PERMISSIONS } from "./permissions"
import { ScreenWidthGuard } from "@/components/ScreenWidthGuard"

export const routes: RouteObject[] = [
  {
    path: "utenti",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <Redirect to="/utenti/utenti" />,
      },
      {
        path: "utenti",
        element: (
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.LETTURA_UTENTI} fallback={<Forbidden />}>
            <Outlet />
          </CheckPermission>
        ),
        children: [
          {
            index: true,
            element: <UsersList />,
          },
          {
            path: ":id",
            element: <UserDetail />,
          },
          {
            path: ":id/:tab",
            element: <UserDetail />,
          },
        ],
      },
      {
        path: "ruoli",
        element: (
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.LETTURA_RUOLI} fallback={<Forbidden />}>
            <Outlet />
          </CheckPermission>
        ),
        children: [
          {
            index: true,
            element: <RolesList />,
          },
          {
            path: ":id",
            element: <RoleDetail />,
          },
          {
            path: ":id/:tab",
            element: <RoleDetail />,
          },
        ],
      },
    ],
  },
]
