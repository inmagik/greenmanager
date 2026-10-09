import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

type Props = {
  to: string
}

export function Redirect({ to }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    // Replace: going back must not land on the redirect again.
    navigate(to, { replace: true })
  }, [navigate, to])

  return null
}
