// Tipos para el perfil de usuario

export interface UserProfile {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  // Documento de identidad
  documentType?: DocumentType
  documentNumber?: string
  documentVerified?: boolean
  documentVerifiedAt?: string
  // Social Login
  socialAccounts?: SocialAccount[]
  // Metadata
  createdAt?: string
  updatedAt?: string
}

export type DocumentType = 'DNI' | 'CE' | 'RUC' | 'PASSPORT'

export interface SocialAccount {
  id: number
  provider: SocialProvider
  providerId: string
  email?: string
  name?: string
  avatar?: string
  linkedAt: string
}

export type SocialProvider = 'google' | 'facebook'

// Validación de documento con DeColecta
export interface DocumentValidationRequest {
  documentType: DocumentType
  documentNumber: string
}

export interface DocumentValidationResponse {
  valid: boolean
  data?: {
    nombres?: string
    apellidoPaterno?: string
    apellidoMaterno?: string
    nombreCompleto?: string
    // RUC
    razonSocial?: string
    estado?: string
    condicion?: string
    direccion?: string
    ubigeo?: string
    departamento?: string
    provincia?: string
    distrito?: string
  }
  message?: string
}

// Cambio de contraseña
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Actualización de perfil
export interface UpdateProfileRequest {
  name?: string
  phone?: string
  documentType?: DocumentType
  documentNumber?: string
}

// OAuth
export interface OAuthConfig {
  provider: SocialProvider
  clientId: string
  redirectUri: string
  scope: string[]
}

export interface OAuthCallbackParams {
  code: string
  state?: string
  provider: SocialProvider
}

export interface OAuthLinkResponse {
  success: boolean
  account?: SocialAccount
  message?: string
}

// Para login con social
export interface SocialLoginRequest {
  provider: SocialProvider
  token: string // Token de acceso de Google/Facebook
  email?: string
}

export interface SocialLoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  user: UserProfile
  store_id?: number
  isNewUser?: boolean
  warning?: string // Warning message when social account couldn't be linked
}
