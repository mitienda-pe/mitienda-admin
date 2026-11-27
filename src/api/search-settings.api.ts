import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StoreSearchSettings, StoreSearchSettingsUpdate } from '@/types/search-settings.types'

export const searchSettingsApi = {
  async getSettings(): Promise<ApiResponse<StoreSearchSettings>> {
    const response = await apiClient.get('/store-search-settings')
    return { success: true, data: response.data.data || response.data }
  },

  async updateSettings(
    data: StoreSearchSettingsUpdate
  ): Promise<ApiResponse<StoreSearchSettings>> {
    const response = await apiClient.put('/store-search-settings', data)
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message
    }
  }
}
