import apiClient from './axios'
import type {
  AbandonedCart,
  AbandonedCartDetail,
  AbandonedCartsFilters
} from '@/types/abandoned-cart.types'
import type { PaginatedResponse, ApiResponse } from '@/types/api.types'

export const abandonedCartsApi = {
  /**
   * Obtener lista de carritos abandonados con filtros y paginación
   */
  async getCarts(filters: AbandonedCartsFilters = {}): Promise<PaginatedResponse<AbandonedCart>> {
    const params = new URLSearchParams()

    if (filters.from) params.append('from', filters.from)
    if (filters.to) params.append('to', filters.to)
    if (filters.customer_type && filters.customer_type !== 'all') {
      params.append('customer_type', filters.customer_type)
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status)
    }
    if (filters.channel && filters.channel !== 'all') {
      params.append('channel', filters.channel)
    }
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.per_page) params.append('per_page', filters.per_page.toString())
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.sort_order) params.append('sort_order', filters.sort_order)

    const response = await apiClient.get(`/abandoned-cart/listarcarritos?${params.toString()}`)

    const rawData = response.data

    if (rawData && rawData.object === 'list') {
      return {
        success: true,
        data: rawData.data || [],
        meta: {
          page: rawData.meta?.page || filters.page || 1,
          limit: rawData.meta?.per_page || filters.per_page || 20,
          total: rawData.meta?.total || 0,
          totalPages: rawData.meta?.total_pages || 0,
          hasMore: (rawData.meta?.page || 1) < (rawData.meta?.total_pages || 0)
        }
      }
    }

    return {
      success: false,
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    }
  },

  /**
   * Obtener detalle de un carrito abandonado
   */
  async getCart(id: number): Promise<ApiResponse<AbandonedCartDetail>> {
    const response = await apiClient.get(`/abandoned-cart/obtener/${id}`)

    const rawData = response.data

    if (rawData && rawData.object === 'abandoned-cart') {
      return {
        success: true,
        data: rawData.data
      }
    }

    return {
      success: false,
      data: undefined
    }
  },

  /**
   * Exportar carritos a Excel (placeholder - implementar cuando sea necesario)
   */
  async exportToExcel(filters: AbandonedCartsFilters = {}): Promise<Blob> {
    const params = new URLSearchParams()

    if (filters.from) params.append('from', filters.from)
    if (filters.to) params.append('to', filters.to)
    if (filters.customer_type && filters.customer_type !== 'all') {
      params.append('customer_type', filters.customer_type)
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status)
    }
    if (filters.channel && filters.channel !== 'all') {
      params.append('channel', filters.channel)
    }
    if (filters.search) params.append('search', filters.search)

    const response = await apiClient.get(`/abandoned-cart/export?${params.toString()}`, {
      responseType: 'blob'
    })

    return response.data
  }
}
