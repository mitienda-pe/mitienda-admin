import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { ProductList, ProductListCreateRequest, ProductListUpdateRequest } from '@/types/product-list.types'

export const productListApi = {
  // Get all product lists
  async getAll(): Promise<ApiResponse<ProductList[]>> {
    const response = await apiClient.get('/product-lists')
    const rawData = response.data

    if (Array.isArray(rawData)) {
      return { success: true, data: rawData }
    }

    return { success: false, data: [] }
  },

  // Get single product list by ID
  async getById(id: number): Promise<ApiResponse<ProductList>> {
    const response = await apiClient.get(`/product-lists/${id}`)
    return { success: true, data: response.data }
  },

  // Create new product list
  async create(data: ProductListCreateRequest): Promise<ApiResponse<ProductList>> {
    const response = await apiClient.post('/product-lists', data)
    return { success: true, data: response.data }
  },

  // Update product list
  async update(id: number, data: ProductListUpdateRequest): Promise<ApiResponse<ProductList>> {
    const response = await apiClient.put(`/product-lists/${id}`, data)
    return { success: true, data: response.data }
  },

  // Delete product list
  async delete(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/product-lists/${id}`)
    return { success: true }
  },

  // Get products linked/unlinked to a product list
  async getProducts(id: number): Promise<ApiResponse<{ linked: any[]; unlinked: any[] }>> {
    const response = await apiClient.get(`/product-lists/${id}/products`)
    return { success: true, data: response.data }
  },

  // Link products to a product list (batch)
  async linkProducts(id: number, productIds: number[]): Promise<ApiResponse<{ linked_count: number }>> {
    const response = await apiClient.post(`/product-lists/${id}/link-products`, { product_ids: productIds })
    return { success: true, data: response.data }
  },

  // Unlink products from a product list (batch)
  async unlinkProducts(id: number, productIds: number[]): Promise<ApiResponse<{ unlinked_count: number }>> {
    const response = await apiClient.post(`/product-lists/${id}/unlink-products`, { product_ids: productIds })
    return { success: true, data: response.data }
  }
}
