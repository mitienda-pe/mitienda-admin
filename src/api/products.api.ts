import apiClient from './axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Product } from '@/types/product.types'

export interface ProductsFilters {
  page?: number
  limit?: number
  search?: string
  category_id?: number | null
  brand_id?: number | null
  published?: boolean | null
  stock_status?: 'all' | 'in_stock' | 'limited' | 'out_of_stock'
}

export const productsApi = {
  // Listar productos con filtros y paginación
  async getProducts(filters: ProductsFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.category_id) params.append('category_id', filters.category_id.toString())
    if (filters.brand_id) params.append('brand_id', filters.brand_id.toString())
    if (filters.published !== null && filters.published !== undefined) {
      params.append('published', filters.published ? '1' : '0')
    }
    if (filters.stock_status && filters.stock_status !== 'all') {
      params.append('stock_status', filters.stock_status)
    }

    const response = await apiClient.get(`/products?${params.toString()}`)
    return response.data
  },

  // Obtener detalle de un producto
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    const response = await apiClient.get(`/products/${id}`)
    return response.data
  },

  // Obtener estadísticas de productos
  async getStats(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/products/stats')
    return response.data
  }
}
