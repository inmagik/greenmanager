import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AuthLayout } from "./auth/AuthLayout"
import { GuestLayout } from "./auth/GuestLayout"
import { Login } from "./pages/login"
import { MODULES_ROUTES } from "virtual:routes"
import { ForgotPassword } from "./pages/forgot-password"
import { ResetPassword } from "./pages/reset-password"
import { VerifyEmail } from "./pages/verify-email"
import { Welcome } from "./pages/welcome"
import { Profile } from "./pages/profile"
import { Home } from "./pages/home"
import { ScreenWidthGuard } from "./components/ScreenWidthGuard"

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
  {
    path: "/profile",
    element: (
      <ScreenWidthGuard>
        <AuthLayout redirect_to="/login" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <Profile />,
      },
    ],
  },
  {
    path: "/login",
    element: (
      <ScreenWidthGuard>
        <GuestLayout redirect_to="/" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <Login />,
      },
    ],
  },
  {
    path: "/forgot-password",
    element: (
      <ScreenWidthGuard>
        <GuestLayout redirect_to="/" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <ForgotPassword />,
      },
    ],
  },
  {
    path: "/reset-password",
    element: (
      <ScreenWidthGuard>
        <GuestLayout redirect_to="/" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: "/verify-email",
    element: (
      <ScreenWidthGuard>
        <GuestLayout redirect_to="/" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <VerifyEmail />,
      },
    ],
  },
  {
    path: "/welcome",
    element: (
      <ScreenWidthGuard>
        <GuestLayout redirect_to="/" />
      </ScreenWidthGuard>
    ),
    children: [
      {
        index: true,
        element: <Welcome />,
      },
    ],
  },
  ...MODULES_ROUTES,
])

export function Navigation() {
  return <RouterProvider router={router} />
}
