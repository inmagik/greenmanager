export type Tenant = {
  id: number
  name: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
  user_count: number
}

export type TenantPayload = Pick<Tenant, "name" | "slug" | "is_active">
