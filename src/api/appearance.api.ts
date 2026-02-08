import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StoreColorConfig, StoreTypographyConfig } from '@/types/appearance.types'

interface ColorsResponseData {
  colors: StoreColorConfig
}

interface TypographyResponseData {
  typography: StoreTypographyConfig
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

  async getTypography(): Promise<ApiResponse<TypographyResponseData>> {
    const response = await apiClient.get('/appearance/typography')
    return response.data
  },

  async updateTypography(
    typography: StoreTypographyConfig
  ): Promise<ApiResponse<TypographyResponseData>> {
    const response = await apiClient.put('/appearance/typography', { typography })
    return response.data
  },
}

export default appearanceApi
