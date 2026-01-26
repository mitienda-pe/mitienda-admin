import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  NetsuiteCredential,
  SaveNetsuiteCredentialsRequest,
  NetsuiteSerie,
  SaveNetsuiteSerieRequest,
  TestNetsuiteConnectionResponse,
  ProductInventoryMapping,
  ProductInventoryListResponse,
  ProductInventoryFilters,
  SaveProductInventoryRequest,
  NetsuiteInventoryNumber,
  SaveInventoryNumberRequest,
  CsvUploadResponse
} from '@/types/netsuite.types'

export const netsuiteApi = {
  // ========== Credenciales API ==========

  /**
   * Get NetSuite credentials for current store
   */
  async getCredentials(tiendaId: number): Promise<ApiResponse<NetsuiteCredential>> {
    const response = await apiClient.get(`/netsuite-credentials/tienda/${tiendaId}`)
    return response.data
  },

  /**
   * Save or update NetSuite credentials
   */
  async saveCredentials(data: SaveNetsuiteCredentialsRequest): Promise<ApiResponse<{ id: number }>> {
    console.log('[netsuiteApi] saveCredentials - request data:', data)
    const response = await apiClient.post('/netsuite-credentials', data)
    console.log('[netsuiteApi] saveCredentials - response:', response.data)
    return response.data
  },

  /**
   * Test NetSuite API connection
   */
  async testConnection(tiendaId: number): Promise<ApiResponse<TestNetsuiteConnectionResponse>> {
    console.log('[netsuiteApi] testConnection - tiendaId:', tiendaId)
    try {
      const response = await apiClient.post(`/netsuite-credentials/${tiendaId}/test`)
      console.log('[netsuiteApi] testConnection - response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('[netsuiteApi] testConnection - error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      throw error
    }
  },

  /**
   * Delete NetSuite credentials
   */
  async deleteCredentials(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/netsuite-credentials/${id}`)
    return response.data
  },

  // ========== Stock Validation Toggle ==========

  /**
   * Get stock validation status for a store
   */
  async getStockValidation(tiendaId: number): Promise<ApiResponse<{ stock_validation_enabled: boolean }>> {
    const response = await apiClient.get(`/netsuite-credentials/${tiendaId}/stock-validation`)
    return response.data
  },

  /**
   * Update stock validation status for a store
   */
  async updateStockValidation(tiendaId: number, enabled: boolean): Promise<ApiResponse<{ stock_validation_enabled: boolean }>> {
    const response = await apiClient.put(`/netsuite-credentials/${tiendaId}/stock-validation`, { enabled })
    return response.data
  },

  // ========== Series API ==========

  /**
   * Get all series mappings for a store
   */
  async getSeries(tiendaId: number): Promise<ApiResponse<NetsuiteSerie[]>> {
    console.log('[netsuiteApi] getSeries - tiendaId:', tiendaId)
    const response = await apiClient.get(`/netsuite-credentials/${tiendaId}/series`)
    console.log('[netsuiteApi] getSeries - response:', response.data)
    return response.data
  },

  /**
   * Save or update a serie mapping
   */
  async saveSerie(tiendaId: number, data: SaveNetsuiteSerieRequest): Promise<ApiResponse<{ id: number }>> {
    const response = await apiClient.post(`/netsuite-credentials/${tiendaId}/series`, data)
    return response.data
  },

  /**
   * Get unmapped series for a store
   */
  async getUnmappedSeries(tiendaId: number): Promise<ApiResponse<NetsuiteSerie[]>> {
    console.log('[netsuiteApi] getUnmappedSeries - tiendaId:', tiendaId)
    const response = await apiClient.get(`/netsuite-credentials/${tiendaId}/series/unmapped`)
    console.log('[netsuiteApi] getUnmappedSeries - response:', response.data)
    return response.data
  },

  // ========== Inventory Mapping API ==========

  /**
   * Get products with their inventory mapping
   */
  async getProductsInventory(tiendaId: number, filters?: ProductInventoryFilters): Promise<ApiResponse<ProductInventoryListResponse>> {
    console.log('[netsuiteApi] getProductsInventory - tiendaId:', tiendaId, 'filters:', filters)
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.has_mapping !== undefined && filters?.has_mapping !== null) {
      params.append('has_mapping', filters.has_mapping ? '1' : '0')
    }
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/netsuite-inventory/${tiendaId}/products?${params.toString()}`)
    console.log('[netsuiteApi] getProductsInventory - response:', response.data)
    return response.data
  },

  /**
   * Get a single product with inventory mapping
   */
  async getProductInventory(tiendaId: number, productId: number): Promise<ApiResponse<ProductInventoryMapping>> {
    console.log('[netsuiteApi] getProductInventory - tiendaId:', tiendaId, 'productId:', productId)
    const response = await apiClient.get(`/netsuite-inventory/${tiendaId}/products/${productId}`)
    console.log('[netsuiteApi] getProductInventory - response:', response.data)
    return response.data
  },

  /**
   * Save or update product NetSuite item ID mapping
   */
  async saveProductInventory(data: SaveProductInventoryRequest): Promise<ApiResponse<{ success: boolean }>> {
    console.log('[netsuiteApi] saveProductInventory - request data:', data)
    const response = await apiClient.post(`/netsuite-inventory/${data.tienda_id}/products/${data.producto_id}`, data)
    console.log('[netsuiteApi] saveProductInventory - response:', response.data)
    return response.data
  },

  /**
   * Get inventory numbers for a specific NetSuite item
   */
  async getInventoryNumbers(tiendaId: number, itemId: number): Promise<ApiResponse<NetsuiteInventoryNumber[]>> {
    console.log('[netsuiteApi] getInventoryNumbers - tiendaId:', tiendaId, 'itemId:', itemId)
    const response = await apiClient.get(`/netsuite-inventory/${tiendaId}/items/${itemId}/numbers`)
    console.log('[netsuiteApi] getInventoryNumbers - response:', response.data)
    return response.data
  },

  /**
   * Save or update an inventory number
   */
  async saveInventoryNumber(tiendaId: number, itemId: number, data: SaveInventoryNumberRequest): Promise<ApiResponse<{ id: number }>> {
    console.log('[netsuiteApi] saveInventoryNumber - request data:', data)
    const response = await apiClient.post(`/netsuite-inventory/${tiendaId}/items/${itemId}/numbers`, data)
    console.log('[netsuiteApi] saveInventoryNumber - response:', response.data)
    return response.data
  },

  /**
   * Update an existing inventory number
   */
  async updateInventoryNumber(tiendaId: number, itemId: number, numberId: number, data: SaveInventoryNumberRequest): Promise<ApiResponse<{ success: boolean }>> {
    console.log('[netsuiteApi] updateInventoryNumber - numberId:', numberId, 'data:', data)
    const response = await apiClient.put(`/netsuite-inventory/${tiendaId}/items/${itemId}/numbers/${numberId}`, data)
    console.log('[netsuiteApi] updateInventoryNumber - response:', response.data)
    return response.data
  },

  /**
   * Delete an inventory number
   */
  async deleteInventoryNumber(tiendaId: number, itemId: number, numberId: number): Promise<ApiResponse<any>> {
    console.log('[netsuiteApi] deleteInventoryNumber - numberId:', numberId)
    const response = await apiClient.delete(`/netsuite-inventory/${tiendaId}/items/${itemId}/numbers/${numberId}`)
    console.log('[netsuiteApi] deleteInventoryNumber - response:', response.data)
    return response.data
  },

  /**
   * Upload CSV file to bulk import inventory numbers
   */
  async uploadInventoryCsv(tiendaId: number, file: File): Promise<ApiResponse<CsvUploadResponse>> {
    console.log('[netsuiteApi] uploadInventoryCsv - tiendaId:', tiendaId, 'file:', file.name)
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post(`/netsuite-inventory/${tiendaId}/upload-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    console.log('[netsuiteApi] uploadInventoryCsv - response:', response.data)
    return response.data
  },

  // ========== Stock Synchronization API ==========

  /**
   * Get NetSuite stock for a specific product
   */
  async getProductNetsuiteStock(productId: number): Promise<ApiResponse<{
    product_id: number
    sku: string
    netsuite_stock: number
    local_stock: number
    inventory_number_id?: string
  }>> {
    console.log('[netsuiteApi] getProductNetsuiteStock - productId:', productId)
    const response = await apiClient.get(`/products/${productId}/netsuite-stock`)
    console.log('[netsuiteApi] getProductNetsuiteStock - response:', response.data)
    return response.data
  },

  /**
   * Sync product stock from NetSuite to local database
   */
  async syncProductStock(productId: number): Promise<ApiResponse<{
    product_id: number
    sku: string
    previous_stock: number
    current_stock: number
    difference: number
  }>> {
    console.log('[netsuiteApi] syncProductStock - productId:', productId)
    const response = await apiClient.post(`/products/${productId}/sync-stock`)
    console.log('[netsuiteApi] syncProductStock - response:', response.data)
    return response.data
  },

  /**
   * Sync stock for multiple products in batch (max 50)
   */
  async syncStockBatch(productIds: number[]): Promise<ApiResponse<{
    synced_count: number
    stock_levels: Record<number, number>
  }>> {
    console.log('[netsuiteApi] syncStockBatch - productIds:', productIds)
    const response = await apiClient.post('/products/sync-stock-batch', {
      product_ids: productIds
    })
    console.log('[netsuiteApi] syncStockBatch - response:', response.data)
    return response.data
  },

  // ========== NetSuite Stock Query API ==========

  /**
   * Get NetSuite stock for all mapped products
   * Read-only query - does not update local stock
   */
  async getNetsuiteStockList(params?: {
    search?: string
    page?: number
    limit?: number
  }): Promise<{
    success: boolean
    data: Array<{
      product_id: number
      sku: string
      product_name: string
      netsuite_item_id: string
      local_stock: number
      netsuite_stock: number | null
      stock_match: boolean
    }>
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
    location_id: number
    checked_at: string
    netsuite_error?: string | null
    message?: string
  }> {
    console.log('[netsuiteApi] getNetsuiteStockList - params:', params)
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await apiClient.get(`/netsuite-stock?${queryParams.toString()}`)
    console.log('[netsuiteApi] getNetsuiteStockList - response:', response.data)
    return response.data
  },

  // ========== Locations API ==========

  /**
   * Get all branches with their NetSuite location IDs
   * Now returns branches from tiendasdirecciones table
   */
  async getLocations(tiendaId: number): Promise<ApiResponse<any[]>> {
    console.log('[netsuiteApi] getLocations (branches) - tiendaId:', tiendaId)
    const response = await apiClient.get('/netsuite-locations')
    console.log('[netsuiteApi] getLocations - response:', response.data)
    return response.data
  },

  /**
   * Update NetSuite location ID for a branch
   */
  async updateBranchLocation(branchId: number, data: {
    netsuite_location_id: string
  }): Promise<ApiResponse<{ success: boolean }>> {
    console.log('[netsuiteApi] updateBranchLocation - branchId:', branchId, 'data:', data)
    const response = await apiClient.put(`/netsuite-locations/${branchId}`, data)
    console.log('[netsuiteApi] updateBranchLocation - response:', response.data)
    return response.data
  },

  /**
   * Clear NetSuite location ID from a branch
   */
  async clearBranchLocation(branchId: number): Promise<ApiResponse<any>> {
    console.log('[netsuiteApi] clearBranchLocation - branchId:', branchId)
    const response = await apiClient.delete(`/netsuite-locations/${branchId}`)
    console.log('[netsuiteApi] clearBranchLocation - response:', response.data)
    return response.data
  }
}
