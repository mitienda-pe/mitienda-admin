import axios from './axios'
import type {
  Combo,
  ComboCreateRequest,
  ComboUpdateRequest,
  ComboListResponse,
  ComboResponse,
  ComboImageResponse
} from '@/types/combo.types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_order?: 'ASC' | 'DESC'
  mostrar_catalogo?: number
  mostrar_carrito?: number
}

export const comboApi = {
  /**
   * Get all combos for the store
   */
  async getAll(params: ListParams = {}): Promise<ComboListResponse> {
    const response = await axios.get('/combos', { params })
    return response.data
  },

  /**
   * Get a single combo by ID with products
   */
  async getById(id: number): Promise<Combo> {
    const response = await axios.get<ComboResponse>(`/combos/${id}`)
    return response.data.data
  },

  /**
   * Create a new combo
   */
  async create(data: ComboCreateRequest): Promise<Combo> {
    const response = await axios.post<ComboResponse>('/combos', data)
    return response.data.data
  },

  /**
   * Update a combo
   */
  async update(id: number, data: ComboUpdateRequest): Promise<Combo> {
    const response = await axios.put<ComboResponse>(`/combos/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a combo (soft delete)
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`/combos/${id}`)
  },

  /**
   * Toggle active status
   */
  async toggle(id: number): Promise<Combo> {
    const response = await axios.patch<ComboResponse>(`/combos/${id}/toggle`)
    return response.data.data
  },

  /**
   * Add a product to a combo
   */
  async addProduct(comboId: number, productoId: number, cantidad: number = 1): Promise<void> {
    await axios.post(`/combos/${comboId}/products`, { producto_id: productoId, cantidad })
  },

  /**
   * Update product quantity in combo
   */
  async updateProduct(comboId: number, productoId: number, cantidad: number): Promise<void> {
    await axios.put(`/combos/${comboId}/products/${productoId}`, { cantidad })
  },

  /**
   * Remove a product from a combo
   */
  async removeProduct(comboId: number, productoId: number): Promise<void> {
    await axios.delete(`/combos/${comboId}/products/${productoId}`)
  },

  /**
   * Upload combo image
   */
  async uploadImage(comboId: number, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)
    const response = await axios.post<ComboImageResponse>(`/combos/${comboId}/image`, formData)
    return response.data.data.image
  },

  /**
   * Get combos for catalog (storefront)
   */
  async getCatalog(): Promise<Combo[]> {
    const response = await axios.get('/combos/catalog')
    return response.data.data
  },

  /**
   * Get combos for cart products (storefront)
   */
  async getForCart(productIds: number[]): Promise<Combo[]> {
    const response = await axios.get('/combos/for-cart', {
      params: { products: productIds }
    })
    return response.data.data
  }
}
