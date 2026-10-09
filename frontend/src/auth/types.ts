export type Tenant = {
  id: number
  name: string
  slug: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type User = {
  id: number
  email: string
  full_name: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login?: string
  roles: number[]
  roles_data: {
    id: number
    tenant: number
    name: string
    permissions: string[]
  }[]
  tenants: number[]
  permissions: string[]
  all_permissions: string[]
  is_locked: boolean
  status: "active" | "inactive" | "locked"
}

export type Tokens = {
  access: string
  refresh: string
}

export type Credentials = {
  email: string
  password: string
}
