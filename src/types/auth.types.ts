// Tipos de autenticación
export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string // Opcional porque la API puede no devolverlo
  token_type: string
  expires_in: number
  user: User
  store_id?: number // La API devuelve store_id
}

export interface User {
  id: number
  name: string
  email: string
  role?: string // Opcional
  avatar?: string
  created_at?: string | null // La API puede no devolverlo
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

// Password reset types
export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  password_confirmation: string
}

export interface ValidateTokenRequest {
  token: string
}

export interface ValidateTokenResponse {
  valid: boolean
  message?: string
}
