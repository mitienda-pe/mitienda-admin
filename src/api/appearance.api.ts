import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StoreColorConfig, StoreTypographyConfig, BrandingConfig } from '@/types/appearance.types'

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

  async getConfig(): Promise<ApiResponse<BrandingConfig>> {
    const response = await apiClient.get('/appearance/config')
    return response.data
  },

  async uploadLogo(file: File): Promise<ApiResponse<BrandingConfig>> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/appearance/config/logo', formData)
    return response.data
  },

  async uploadFavicon(file: File): Promise<ApiResponse<BrandingConfig>> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/appearance/config/favicon', formData)
    return response.data
  },

  async deleteLogo(): Promise<ApiResponse<BrandingConfig>> {
    const response = await apiClient.delete('/appearance/config/logo')
    return response.data
  },

  async deleteFavicon(): Promise<ApiResponse<BrandingConfig>> {
    const response = await apiClient.delete('/appearance/config/favicon')
    return response.data
  },
}

export default appearanceApi
