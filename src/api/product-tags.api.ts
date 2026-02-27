import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  ProductTag,
  ProductTagAssignment,
  ProductTagFormData,
  ProductTagAssignmentFormData
} from '@/types/product-tag.types'

export const productTagsApi = {
  // CRUD de Product Tags

  /**
   * GET /api/v1/product-tags
   * Obtener todas las etiquetas de la tienda
   */
  async getTags(): Promise<ApiResponse<ProductTag[]>> {
    const response = await apiClient.get('/product-tags')
    return response.data
  },

  /**
   * GET /api/v1/product-tags/:id
   * Obtener una etiqueta específica
   */
  async getTag(id: number): Promise<ApiResponse<ProductTag>> {
    const response = await apiClient.get(`/product-tags/${id}`)
    return response.data
  },

  /**
   * POST /api/v1/product-tags
   * Crear una nueva etiqueta
   */
  async createTag(data: ProductTagFormData): Promise<ApiResponse<ProductTag>> {
    const response = await apiClient.post('/product-tags', data)
    return response.data
  },

  /**
   * PUT /api/v1/product-tags/:id
   * Actualizar una etiqueta
   */
  async updateTag(id: number, data: Partial<ProductTagFormData>): Promise<ApiResponse<ProductTag>> {
    const response = await apiClient.put(`/product-tags/${id}`, data)
    return response.data
  },

  /**
   * DELETE /api/v1/product-tags/:id
   * Eliminar una etiqueta
   */
  async deleteTag(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/product-tags/${id}`)
    return response.data
  },

  // Asignación de tags a productos

  /**
   * GET /api/v1/products/:productId/tags
   * Obtener etiquetas asignadas a un producto
   */
  async getProductTags(productId: number): Promise<ApiResponse<ProductTagAssignment[]>> {
    const response = await apiClient.get(`/products/${productId}/tags`)
    return response.data
  },

  /**
   * POST /api/v1/products/:productId/tags
   * Asignar etiquetas a un producto
   */
  async assignProductTags(
    productId: number,
    tags: ProductTagAssignmentFormData[]
  ): Promise<ApiResponse<ProductTagAssignment[]>> {
    const response = await apiClient.post(`/products/${productId}/tags`, { tags })
    return response.data
  },

  /**
   * DELETE /api/v1/products/:productId/tags/:tagId
   * Remover una etiqueta de un producto
   */
  async unassignProductTag(productId: number, tagId: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/products/${productId}/tags/${tagId}`)
    return response.data
  },

  // Vinculación masiva de productos a etiquetas

  /**
   * GET /api/v1/product-tags/:id/products
   * Obtener productos vinculados y no vinculados a una etiqueta
   */
  async getProducts(id: number): Promise<ApiResponse<{ linked: any[]; unlinked: any[] }>> {
    const response = await apiClient.get(`/product-tags/${id}/products`)
    return { success: true, data: response.data }
  },

  /**
   * POST /api/v1/product-tags/:id/link-products
   * Vincular productos masivamente a una etiqueta
   */
  async linkProducts(id: number, productIds: number[]): Promise<ApiResponse<{ linked_count: number }>> {
    const response = await apiClient.post(`/product-tags/${id}/link-products`, { product_ids: productIds })
    return { success: true, data: response.data }
  },

  /**
   * POST /api/v1/product-tags/:id/unlink-products
   * Desvincular productos masivamente de una etiqueta
   */
  async unlinkProducts(id: number, productIds: number[]): Promise<ApiResponse<{ unlinked_count: number }>> {
    const response = await apiClient.post(`/product-tags/${id}/unlink-products`, { product_ids: productIds })
    return { success: true, data: response.data }
  }
}
