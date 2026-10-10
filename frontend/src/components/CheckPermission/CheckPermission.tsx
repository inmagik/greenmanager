import { useHasPermission } from "@/hooks/useHasPermission"

type Props = {
  permission: string | { oneOf: string[] } | { allOf: string[] }
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CheckPermission({ permission, children, fallback }: Props) {
  const hasPermission = useHasPermission(permission)

  if (!hasPermission) {
    return fallback ?? null
  }

  return children
}
