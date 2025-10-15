import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  SuperAdminInfo,
  AdminStoresResponse,
  AdminStoresFilters,
  ImpersonationResponse,
  ExitImpersonationResponse
} from '@/types/admin.types'

export const adminApi = {
  /**
   * Verificar si el usuario actual es superadministrador
   */
  async checkSuperAdmin(): Promise<ApiResponse<SuperAdminInfo>> {
    const response = await apiClient.get('/superadmin/check')
    return response.data
  },

  /**
   * Obtener listado de todas las tiendas (solo superadmin)
   * @param filters - Filtros opcionales (status, plan, search, page)
   */
  async getStores(filters?: AdminStoresFilters): Promise<ApiResponse<AdminStoresResponse>> {
    const params = new URLSearchParams()

    if (filters?.status) {
      params.append('status', filters.status)
    }
    if (filters?.plan) {
      params.append('plan', filters.plan)
    }
    if (filters?.search) {
      params.append('search', filters.search)
    }
    if (filters?.page) {
      params.append('page', filters.page.toString())
    }

    const response = await apiClient.get(`/superadmin/stores?${params.toString()}`)
    return response.data
  },

  /**
   * Generar token para acceder a una tienda específica (impersonación)
   * @param storeId - ID de la tienda a acceder
   */
  async impersonate(storeId: number): Promise<ApiResponse<ImpersonationResponse>> {
    const response = await apiClient.post('/superadmin/impersonate', { store_id: storeId })
    return response.data
  },

  /**
   * Salir del modo impersonación y restaurar token original
   * @param originalToken - Token original antes de la impersonación
   */
  async exitImpersonation(originalToken: string): Promise<ApiResponse<ExitImpersonationResponse>> {
    const response = await apiClient.post('/superadmin/exit-impersonation', {
      original_token: originalToken
    })
    return response.data
  }
}
