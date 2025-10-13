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
  }
}
