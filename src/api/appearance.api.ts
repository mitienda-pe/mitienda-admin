import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StoreColorConfig } from '@/types/appearance.types'

interface ColorsResponseData {
  colors: StoreColorConfig
}

const appearanceApi = {
  async getColors(): Promise<ApiResponse<ColorsResponseData>> {
    const response = await apiClient.get('/appearance/colors')
    return response.data
  },

  async updateColors(colors: StoreColorConfig): Promise<ApiResponse<ColorsResponseData>> {
    const response = await apiClient.put('/appearance/colors', { colors })
    return response.data
  },
}

export default appearanceApi
