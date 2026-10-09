import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "./auth"
import classes from "./GuestLayout.module.css"
import { LanguageSelector } from "@/components/LanguageSelector"

type GuestLayoutProps = {
  redirect_to: string
}

export function GuestLayout({ redirect_to }: GuestLayoutProps) {
  const auth = useAuth()

  if (auth.user) {
    return <Navigate to={redirect_to} replace />
  }

  return (
    <main className={classes.guestLayout}>
      <LanguageSelector compact className={classes.languageSelector} />
      <div className={classes.guestBrand}>
        <img src="/logo.svg" alt="" />
        <span>GreenManager</span>
      </div>
      <Outlet />
    </main>
  )
}
