import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { ProductCardConfig } from '@/types/product-card.types'

const productCardApi = {
  async getConfig(): Promise<ApiResponse<ProductCardConfig>> {
    const response = await apiClient.get('/appearance/product-card')
    return response.data
  },

  async updateConfig(
    config: ProductCardConfig
  ): Promise<ApiResponse<ProductCardConfig>> {
    const response = await apiClient.put('/appearance/product-card', config)
    return response.data
  }
}

export default productCardApi
