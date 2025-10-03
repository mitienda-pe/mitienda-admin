import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { Category, Brand } from '@/types/product.types'

export const catalogApi = {
  // Obtener todas las categorías
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get('/categories')
    return response.data
  },

  // Obtener todas las marcas
  async getBrands(): Promise<ApiResponse<Brand[]>> {
    const response = await apiClient.get('/brands')
    return response.data
  }
}
