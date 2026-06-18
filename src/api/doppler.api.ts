import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StoreDopplerSettings, StoreDopplerUpdate } from '@/types/doppler.types'

export const dopplerApi = {
  async getSettings(): Promise<ApiResponse<StoreDopplerSettings>> {
    const response = await apiClient.get('/store-doppler')
    return { success: true, data: response.data.data || response.data }
  },

  async updateSettings(data: StoreDopplerUpdate): Promise<ApiResponse<StoreDopplerSettings>> {
    const response = await apiClient.put('/store-doppler', data)
    return { success: true, data: response.data.data || response.data }
  }
}
