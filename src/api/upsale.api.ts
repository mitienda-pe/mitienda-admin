import axios from './axios'
import type {
  Upsale,
  UpsaleCreateRequest,
  UpsaleUpdateRequest,
  UpsaleListResponse,
  UpsaleResponse
} from '@/types/upsale.types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_order?: 'ASC' | 'DESC'
}

export const upsaleApi = {
  /**
   * Get all upsales for the store
   */
  async getAll(params: ListParams = {}): Promise<UpsaleListResponse> {
    const response = await axios.get('/upsales', { params })
    return response.data
  },

  /**
   * Get a single upsale by ID with triggers and suggested products
   */
  async getById(id: number): Promise<Upsale> {
    const response = await axios.get<UpsaleResponse>(`/upsales/${id}`)
    return response.data.data
  },

  /**
   * Create a new upsale
   */
  async create(data: UpsaleCreateRequest): Promise<Upsale> {
    const response = await axios.post<UpsaleResponse>('/upsales', data)
    return response.data.data
  },

  /**
   * Update an upsale
   */
  async update(id: number, data: UpsaleUpdateRequest): Promise<Upsale> {
    const response = await axios.put<UpsaleResponse>(`/upsales/${id}`, data)
    return response.data.data
  },

  /**
   * Delete an upsale (soft delete)
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`/upsales/${id}`)
  },

  /**
   * Toggle active status
   */
  async toggle(id: number): Promise<Upsale> {
    const response = await axios.patch<UpsaleResponse>(`/upsales/${id}/toggle`)
    return response.data.data
  },

  /**
   * Add a trigger product
   */
  async addTrigger(upsaleId: number, productoId: number): Promise<void> {
    await axios.post(`/upsales/${upsaleId}/triggers`, { producto_id: productoId })
  },

  /**
   * Remove a trigger product
   */
  async removeTrigger(upsaleId: number, productoId: number): Promise<void> {
    await axios.delete(`/upsales/${upsaleId}/triggers/${productoId}`)
  },

  /**
   * Add a suggested product
   */
  async addSuggested(upsaleId: number, productoId: number): Promise<void> {
    await axios.post(`/upsales/${upsaleId}/suggested`, { producto_id: productoId })
  },

  /**
   * Remove a suggested product
   */
  async removeSuggested(upsaleId: number, productoId: number): Promise<void> {
    await axios.delete(`/upsales/${upsaleId}/suggested/${productoId}`)
  },

  /**
   * Get upsale suggestions for cart products (storefront)
   */
  async getForCart(productIds: number[]): Promise<Upsale[]> {
    const response = await axios.get('/upsales/for-cart', {
      params: { products: productIds }
    })
    return response.data.data
  }
}
