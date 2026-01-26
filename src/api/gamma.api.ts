import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { Gamma, GammaCreateRequest, GammaUpdateRequest } from '@/types/gamma.types'

export const gammaApi = {
  // Get all gammas (optionally filtered by marca_id)
  async getAll(marcaId?: number): Promise<ApiResponse<Gamma[]>> {
    const params = marcaId ? { marca_id: marcaId } : {}
    const response = await apiClient.get('/gammas', { params })
    const rawData = response.data

    if (Array.isArray(rawData)) {
      return { success: true, data: rawData }
    }

    return { success: false, data: [] }
  },

  // Get gammas by brand ID (for cascading dropdown)
  async getByBrand(marcaId: number): Promise<ApiResponse<Gamma[]>> {
    const response = await apiClient.get(`/gammas/by-brand/${marcaId}`)
    const rawData = response.data

    if (Array.isArray(rawData)) {
      return { success: true, data: rawData }
    }

    return { success: false, data: [] }
  },

  // Get single gamma by ID
  async getById(id: number): Promise<ApiResponse<Gamma>> {
    const response = await apiClient.get(`/gammas/${id}`)
    return { success: true, data: response.data }
  },

  // Create new gamma
  async create(data: GammaCreateRequest): Promise<ApiResponse<Gamma>> {
    const response = await apiClient.post('/gammas', data)
    return { success: true, data: response.data }
  },

  // Update gamma
  async update(id: number, data: GammaUpdateRequest): Promise<ApiResponse<Gamma>> {
    const response = await apiClient.put(`/gammas/${id}`, data)
    return { success: true, data: response.data }
  },

  // Delete gamma
  async delete(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/gammas/${id}`)
    return { success: true }
  }
}
