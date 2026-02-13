import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StoreTiktokSettings, StoreTiktokUpdate } from '@/types/tiktok.types'

export const tiktokApi = {
  async getSettings(): Promise<ApiResponse<StoreTiktokSettings>> {
    const response = await apiClient.get('/store-tiktok')
    return { success: true, data: response.data.data || response.data }
  },

  async updateSettings(data: StoreTiktokUpdate): Promise<ApiResponse<StoreTiktokSettings>> {
    const response = await apiClient.put('/store-tiktok', data)
    return { success: true, data: response.data.data || response.data }
  }
}
