import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StoreFacebookSettings, StoreFacebookUpdate } from '@/types/facebook.types'

export const facebookApi = {
  async getSettings(): Promise<ApiResponse<StoreFacebookSettings>> {
    const response = await apiClient.get('/store-facebook')
    return { success: true, data: response.data.data || response.data }
  },

  async updateSettings(data: StoreFacebookUpdate): Promise<ApiResponse<StoreFacebookSettings>> {
    const response = await apiClient.put('/store-facebook', data)
    return { success: true, data: response.data.data || response.data }
  }
}
