import apiClient from './axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { StoreComponent, ComponentUpdateData } from '@/types/component.types'

const transformComponent = (raw: any): StoreComponent => ({
  id: parseInt(raw.tiendacomponente_id),
  tienda_id: parseInt(raw.tienda_id),
  code: raw.tiendacomponente_codigo,
  type_id: parseInt(raw.componentetipo_id),
  type_name: raw.componentetipo_nombre || '',
  name: raw.tiendacomponente_nombre || '',
  active: parseInt(raw.tiendacomponente_swactivo) === 1,
  created_at: raw.tiendacomponente_fecharegistro,
  html_content: raw.html_content ?? undefined,
  html_record_id: raw.html_record_id ? parseInt(raw.html_record_id) : null,
})

export const componentsApi = {
  async getAll(params?: {
    page?: number
    limit?: number
    sort?: string
    order?: string
  }): Promise<PaginatedResponse<StoreComponent>> {
    const response = await apiClient.get('/components', { params })
    const rawData = response.data

    if (rawData.success && Array.isArray(rawData.data)) {
      return {
        success: true,
        data: rawData.data.map(transformComponent),
        meta: {
          page: rawData.pagination?.page ?? 1,
          perPage: rawData.pagination?.perPage ?? 20,
          total: rawData.pagination?.total ?? 0,
          totalPages: rawData.pagination?.totalPages ?? 1,
          hasMore: rawData.pagination?.hasMore ?? false,
        },
      }
    }

    return {
      success: false,
      data: [],
      meta: { page: 1, perPage: 20, total: 0, totalPages: 1, hasMore: false },
    }
  },

  async getById(id: number): Promise<ApiResponse<StoreComponent>> {
    const response = await apiClient.get(`/components/${id}`)
    const rawData = response.data

    if (rawData.success && rawData.data) {
      return { success: true, data: transformComponent(rawData.data) }
    }

    return { success: false }
  },

  async update(id: number, data: ComponentUpdateData): Promise<ApiResponse<StoreComponent>> {
    const response = await apiClient.put(`/components/${id}`, data)
    const rawData = response.data

    if (rawData.success && rawData.data) {
      return { success: true, data: transformComponent(rawData.data) }
    }

    return { success: false, message: rawData.message }
  },

  async toggleActive(id: number): Promise<ApiResponse<StoreComponent>> {
    const response = await apiClient.put(`/components/${id}/toggle-active`)
    const rawData = response.data

    if (rawData.success && rawData.data) {
      return { success: true, data: transformComponent(rawData.data) }
    }

    return { success: false }
  },
}
