import { AuthLayout } from "@/auth/AuthLayout"
import { CheckStaff } from "@/components/CheckStaff"
import { Forbidden } from "@/components/StatusPage"
import { ScreenWidthGuard } from "@/components/ScreenWidthGuard"
import type { RouteObject } from "react-router-dom"
import { TenantsList } from "./pages/TenantsList"
import { TenantDetail } from "./pages/TenantDetail"

export const routes: RouteObject[] = [
  {
    path: "tenants",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <CheckStaff fallback={<Forbidden />}><TenantsList /></CheckStaff>,
      },
      {
        path: ":id",
        element: <CheckStaff fallback={<Forbidden />}><TenantDetail /></CheckStaff>,
      },
      {
        path: ":id/:tab",
        element: <CheckStaff fallback={<Forbidden />}><TenantDetail /></CheckStaff>,
      },
    ],
  },
]
