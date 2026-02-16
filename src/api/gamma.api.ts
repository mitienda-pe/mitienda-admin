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
  },

  // Get products linked/unlinked to a gamma
  async getProducts(id: number): Promise<ApiResponse<{ linked: any[]; unlinked: any[] }>> {
    const response = await apiClient.get(`/gammas/${id}/products`)
    return { success: true, data: response.data }
  },

  // Link products to a gamma (batch)
  async linkProducts(id: number, productIds: number[]): Promise<ApiResponse<{ linked_count: number }>> {
    const response = await apiClient.post(`/gammas/${id}/link-products`, { product_ids: productIds })
    return { success: true, data: response.data }
  },

  // Unlink products from a gamma (batch)
  async unlinkProducts(id: number, productIds: number[]): Promise<ApiResponse<{ unlinked_count: number }>> {
    const response = await apiClient.post(`/gammas/${id}/unlink-products`, { product_ids: productIds })
    return { success: true, data: response.data }
  },

  // Upload image (square, cover, or og) for a gamma
  async uploadImage(id: number, file: File, imageType: string): Promise<ApiResponse<Gamma>> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('image_type', imageType)
    const response = await apiClient.post(`/gammas/${id}/upload-image`, formData)
    const raw = response.data?.data ?? response.data
    return { success: true, data: raw }
  },

  // Delete image from a gamma
  async deleteImage(id: number, imageType: string): Promise<ApiResponse<Gamma>> {
    const response = await apiClient.delete(`/gammas/${id}/delete-image/${imageType}`)
    const raw = response.data?.data ?? response.data
    return { success: true, data: raw }
  }
}
