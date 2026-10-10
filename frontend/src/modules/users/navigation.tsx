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
import { UsersIndex } from "./components/UsersIndex"

export const routes: RouteObject[] = [
  {
    path: "users",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <UsersIndex />,
      },
      {
        path: "users",
        element: (
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.READ_USERS} fallback={<Forbidden />}>
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
        path: "roles",
        element: (
          <CheckPermission permission={AUTH_CORE_PERMISSIONS.READ_ROLES} fallback={<Forbidden />}>
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
