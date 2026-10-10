import { useAuth } from "@/auth/auth"
import { Navigate } from "react-router-dom"

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CheckStaff({ children, fallback }: Props) {
  const { user } = useAuth()

  if (!user?.is_staff) {
    return fallback ?? <Navigate to="/" replace />
  }

  return children
}
