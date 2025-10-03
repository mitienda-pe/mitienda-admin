// Tipos de autenticación
export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface User {
  id: number
  name: string
  email: string
  role: string
  avatar?: string
  created_at: string
}

export interface Store {
  id: number
  name: string
  slug: string
  logo?: string
  url?: string
  plan: string
  status: string
}

export interface AuthState {
  user: User | null
  stores: Store[]
  selectedStore: Store | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}
