import { AuthLayout } from "@/auth/AuthLayout"
import { CheckPermission } from "@/components/CheckPermission"
import { Redirect } from "@/components/Redirect"
import { ScreenWidthGuard } from "@/components/ScreenWidthGuard"
import { Forbidden } from "@/components/StatusPage"
import { Outlet, type RouteObject } from "react-router-dom"
import { ElementDetail } from "./pages/ElementDetail"
import { ElementsList } from "./pages/ElementsList"
import { INVENTORY_PERMISSIONS } from "./permissions"

export const routes: RouteObject[] = [
  {
    path: "inventory",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <Redirect to="/inventory/elements" />,
      },
      {
        element: (
          <CheckPermission permission={INVENTORY_PERMISSIONS.READ_ELEMENTS} fallback={<Forbidden />}>
            <Outlet />
          </CheckPermission>
        ),
        children: [
          {
            path: "elements",
            children: [
              { index: true, element: <ElementsList /> },
              { path: ":id", element: <ElementDetail /> },
              { path: ":id/:tab", element: <ElementDetail /> },
            ],
          },
        ],
      },
    ],
  },
]
