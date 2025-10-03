import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { LoginCredentials, LoginResponse, User, Store } from '@/types/auth.types'

export const authApi = {
  // Login con email y password
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  // Renovar token
  async refresh(refreshToken: string): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },

  // Cerrar sesión
  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  // Test de conectividad
  async test(): Promise<ApiResponse> {
    const response = await apiClient.get('/auth/test')
    return response.data
  },

  // Obtener perfil del usuario
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/user/profile')
    return response.data
  },

  // Obtener tiendas del usuario
  async getStores(): Promise<ApiResponse<Store[]>> {
    const response = await apiClient.get('/user/stores')

    // La API devuelve { error: 0, data: { stores: [...] } }
    // Necesitamos mapear el formato
    if (response.data.success && response.data.data?.stores) {
      const stores = response.data.data.stores.map((store: any) => ({
        id: parseInt(store.tienda_id),
        name: store.tienda_nombre_display || store.tienda_nombre_comercial,
        slug: store.tienda_nombreurl,
        logo: null, // La API no devuelve logo
        url: store.tienda_url,
        plan: store.plan_titulo,
        status: store.tienda_plan_status_text === 'Activo' ? 'active' : 'inactive'
      }))

      return {
        success: true,
        data: stores
      }
    }

    return response.data
  },

  // Seleccionar tienda activa
  async selectStore(storeId: number): Promise<ApiResponse> {
    const response = await apiClient.post('/user/store/select', { store_id: storeId })
    return response.data
  }
}
