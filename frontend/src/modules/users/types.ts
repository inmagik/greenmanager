export type Role = {
  id: number
  tenant: number
  name: string
  permissions: string[]
  user_count: number
}

export type Permission = {
  module: string
  name: string
  description: string
  code: string
}
