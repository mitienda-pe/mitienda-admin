import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  UserProfile,
  UpdateProfileRequest,
  DocumentValidationRequest,
  DocumentValidationResponse,
  SocialAccount,
  SocialProvider,
  OAuthLinkResponse,
  SocialLoginRequest,
  SocialLoginResponse
} from '@/types/profile.types'

const USE_MOCKS = false

// Mock data para desarrollo
const MOCK_PROFILE: UserProfile = {
  id: 1,
  name: 'Carlos García',
  email: 'carlos@example.com',
  phone: '987654321',
  documentType: 'DNI',
  documentNumber: '12345678',
  documentVerified: true,
  documentVerifiedAt: '2024-01-15T10:30:00Z',
  socialAccounts: [
    {
      id: 1,
      provider: 'google',
      providerId: '123456789',
      email: 'carlos@gmail.com',
      name: 'Carlos García',
      linkedAt: '2024-01-10T08:00:00Z'
    }
  ],
  createdAt: '2023-06-01T00:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
}

export const profileApi = {
  // Obtener perfil del usuario actual
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    if (USE_MOCKS) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, data: MOCK_PROFILE }
    }

    const response = await apiClient.get('/user/profile')

    // Mapear respuesta de la API
    if (response.data.success && response.data.data) {
      const data = response.data.data
      const profile: UserProfile = {
        id: data.usuario_id || data.id,
        name: data.usuario_nombre || data.name,
        email: data.usuario_email || data.email,
        phone: data.usuario_telefono || data.phone,
        documentType: data.usuario_tipodocumento || data.document_type,
        documentNumber: data.usuario_documento || data.document_number,
        documentVerified: data.usuario_documento_verificado || data.document_verified,
        documentVerifiedAt: data.usuario_documento_verificado_at || data.document_verified_at,
        socialAccounts: data.social_accounts?.map((acc: any) => ({
          id: acc.id,
          provider: acc.provider,
          providerId: acc.provider_id,
          email: acc.email,
          name: acc.name,
          avatar: acc.avatar,
          linkedAt: acc.linked_at || acc.created_at
        })) || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
      return { success: true, data: profile }
    }

    return response.data
  },

  // Actualizar perfil
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    if (USE_MOCKS) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const updatedProfile = { ...MOCK_PROFILE, ...data, updatedAt: new Date().toISOString() }
      return { success: true, data: updatedProfile, message: 'Perfil actualizado correctamente' }
    }

    const payload = {
      usuario_nombre: data.name,
      usuario_telefono: data.phone,
      usuario_tipodocumento: data.documentType,
      usuario_documento: data.documentNumber
    }

    const response = await apiClient.put('/user/profile', payload)
    return response.data
  },

  // Validar documento con DeColecta
  async validateDocument(data: DocumentValidationRequest): Promise<ApiResponse<DocumentValidationResponse>> {
    if (USE_MOCKS) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (data.documentType === 'DNI' && data.documentNumber === '12345678') {
        return {
          success: true,
          data: {
            valid: true,
            data: {
              nombres: 'CARLOS ALBERTO',
              apellidoPaterno: 'GARCÍA',
              apellidoMaterno: 'PÉREZ',
              nombreCompleto: 'GARCÍA PÉREZ, CARLOS ALBERTO'
            }
          }
        }
      }

      if (data.documentType === 'RUC' && data.documentNumber === '20123456789') {
        return {
          success: true,
          data: {
            valid: true,
            data: {
              razonSocial: 'MI EMPRESA S.A.C.',
              estado: 'ACTIVO',
              condicion: 'HABIDO',
              direccion: 'AV. EJEMPLO 123',
              departamento: 'LIMA',
              provincia: 'LIMA',
              distrito: 'MIRAFLORES'
            }
          }
        }
      }

      return {
        success: true,
        data: {
          valid: false,
          message: 'No se encontró información para el documento ingresado'
        }
      }
    }

    const response = await apiClient.post('/user/document/validate', {
      document_type: data.documentType,
      document_number: data.documentNumber
    })

    return response.data
  },

  // Obtener cuentas sociales vinculadas
  async getSocialAccounts(): Promise<ApiResponse<SocialAccount[]>> {
    if (USE_MOCKS) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { success: true, data: MOCK_PROFILE.socialAccounts || [] }
    }

    const response = await apiClient.get('/user/social-accounts')
    return response.data
  },

  // Vincular cuenta social
  async linkSocialAccount(provider: SocialProvider, token: string): Promise<ApiResponse<OAuthLinkResponse>> {
    if (USE_MOCKS) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newAccount: SocialAccount = {
        id: Date.now(),
        provider,
        providerId: '999999999',
        email: provider === 'google' ? 'user@gmail.com' : 'user@facebook.com',
        name: 'Usuario Social',
        linkedAt: new Date().toISOString()
      }
      return {
        success: true,
        data: { success: true, account: newAccount, message: 'Cuenta vinculada correctamente' }
      }
    }

    const response = await apiClient.post('/user/social-accounts/link', {
      provider,
      access_token: token
    })
    return response.data
  },

  // Desvincular cuenta social
  async unlinkSocialAccount(accountId: number): Promise<ApiResponse> {
    if (USE_MOCKS) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { success: true, message: 'Cuenta desvinculada correctamente' }
    }

    const response = await apiClient.delete(`/user/social-accounts/${accountId}`)
    return response.data
  },

  // Login con cuenta social
  async socialLogin(data: SocialLoginRequest): Promise<ApiResponse<SocialLoginResponse>> {
    if (USE_MOCKS) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        success: true,
        data: {
          access_token: 'mock_access_token_social',
          refresh_token: 'mock_refresh_token_social',
          token_type: 'Bearer',
          expires_in: 3600,
          user: MOCK_PROFILE,
          isNewUser: false
        }
      }
    }

    const response = await apiClient.post('/auth/social-login', {
      provider: data.provider,
      access_token: data.token,
      email: data.email
    })
    return response.data
  },

  // Obtener URL de OAuth para redirección
  getOAuthUrl(provider: SocialProvider, redirectUri: string): string {
    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem('oauth_state', state)

    if (provider === 'google') {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const scope = encodeURIComponent('openid email profile')
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`
    }

    if (provider === 'facebook') {
      const clientId = import.meta.env.VITE_FACEBOOK_APP_ID
      const scope = encodeURIComponent('email,public_profile')
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`
    }

    throw new Error(`Provider ${provider} no soportado`)
  },

  // Manejar callback de OAuth
  async handleOAuthCallback(provider: SocialProvider, code: string, redirectUri: string): Promise<ApiResponse<SocialLoginResponse>> {
    const response = await apiClient.post('/auth/oauth/callback', {
      provider,
      code,
      redirect_uri: redirectUri
    })
    return response.data
  }
}
