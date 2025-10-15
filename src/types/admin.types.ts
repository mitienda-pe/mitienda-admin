// Tipos para el módulo de Super-Administrador

export interface SuperAdminInfo {
  is_superadmin: boolean
  superadmin_type_id?: number
  superadmin_type_name?: string
  partner_id?: number
  partner_name?: string
}

export interface AdminStorePlan {
  id: number
  name: string
  status: 'active' | 'expired' | 'suspended'
  started_at: string | null
  expires_at: string | null
}

export interface AdminStoreOwner {
  name: string
  email: string
}

export interface AdminStore {
  id: number
  name: string
  slug: string
  url: string
  ssl_enabled: boolean
  created_at: string
  plan: AdminStorePlan
  owner: AdminStoreOwner
}

export interface AdminStoresFilters {
  status?: 'active' | 'expired' | 'suspended' | ''
  plan?: string
  search?: string
  page?: number
}

export interface AdminStoresPagination {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface AdminStoresResponse {
  stores: AdminStore[]
  pagination: AdminStoresPagination
}

export interface ImpersonationContext {
  original_user_id: number
  original_token: string
  target_store_id: number
  started_at: string
}

export interface ImpersonationResponse {
  access_token: string
  expires_in: number
  store_id: number
  impersonation_context: ImpersonationContext
}

export interface ExitImpersonationResponse {
  access_token: string
  message: string
}
