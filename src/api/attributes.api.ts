import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  StoreAttribute,
  CreateAttributePayload,
  UpdateAttributePayload,
  AttributeOption,
} from '@/types/attribute.types'

export const attributesApi = {
  async getAll(): Promise<ApiResponse<StoreAttribute[]>> {
    const response = await apiClient.get('/store-attributes')
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<StoreAttribute>> {
    const response = await apiClient.get(`/store-attributes/${id}`)
    return response.data
  },

  async create(payload: CreateAttributePayload): Promise<ApiResponse<StoreAttribute>> {
    const response = await apiClient.post('/store-attributes', payload)
    return response.data
  },

  async update(id: number, payload: UpdateAttributePayload): Promise<ApiResponse<void>> {
    const response = await apiClient.put(`/store-attributes/${id}`, payload)
    return response.data
  },

  async remove(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/store-attributes/${id}`)
    return response.data
  },

  async addOption(attributeId: number, text: string): Promise<ApiResponse<AttributeOption>> {
    const response = await apiClient.post(`/store-attributes/${attributeId}/options`, { text })
    return response.data
  },

  async updateOption(
    attributeId: number,
    optionId: number,
    text: string
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.put(
      `/store-attributes/${attributeId}/options/${optionId}`,
      { text }
    )
    return response.data
  },

  async removeOption(attributeId: number, optionId: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(
      `/store-attributes/${attributeId}/options/${optionId}`
    )
    return response.data
  },
}
