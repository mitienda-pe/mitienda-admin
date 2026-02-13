import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StoreSeoSettings, StoreSeoUpdate } from '@/types/seo.types'

export const seoApi = {
  async getSettings(): Promise<ApiResponse<StoreSeoSettings>> {
    const response = await apiClient.get('/store-seo')
    return { success: true, data: response.data.data || response.data }
  },

  async updateSettings(data: StoreSeoUpdate): Promise<ApiResponse<StoreSeoSettings>> {
    const response = await apiClient.put('/store-seo', data)
    return { success: true, data: response.data.data || response.data }
  },

  async uploadOgImage(file: File): Promise<ApiResponse<{ og_image_url: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/store-seo/og-image', formData)
    return { success: true, data: response.data.data || response.data }
  },

  async deleteOgImage(): Promise<ApiResponse<{ og_image_url: null }>> {
    const response = await apiClient.delete('/store-seo/og-image')
    return { success: true, data: response.data.data || response.data }
  }
}
