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
    const response = await apiClient.post('/netsuite-credentials', data)
    return response.data
  },

  /**
   * Test NetSuite API connection
   */
  async testConnection(tiendaId: number): Promise<ApiResponse<TestNetsuiteConnectionResponse>> {
    try {
      const response = await apiClient.post(`/netsuite-credentials/${tiendaId}/test`)
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
    const response = await apiClient.get(`/netsuite-credentials/${tiendaId}/series`)
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
    const response = await apiClient.get(`/netsuite-credentials/${tiendaId}/series/unmapped`)
    return response.data
  },

  // ========== Inventory Mapping API ==========

  /**
   * Get products with their inventory mapping
   */
  async getProductsInventory(tiendaId: number, filters?: ProductInventoryFilters): Promise<ApiResponse<ProductInventoryListResponse>> {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.has_mapping !== undefined && filters?.has_mapping !== null) {
      params.append('has_mapping', filters.has_mapping ? '1' : '0')
    }
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/netsuite-inventory/${tiendaId}/products?${params.toString()}`)
    return response.data
  },

  /**
   * Get a single product with inventory mapping
   */
  async getProductInventory(tiendaId: number, productId: number): Promise<ApiResponse<ProductInventoryMapping>> {
    const response = await apiClient.get(`/netsuite-inventory/${tiendaId}/products/${productId}`)
    return response.data
  },

  /**
   * Save or update product NetSuite item ID mapping
   */
  async saveProductInventory(data: SaveProductInventoryRequest): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.post(`/netsuite-inventory/${data.tienda_id}/products/${data.producto_id}`, data)
    return response.data
  },

  /**
   * Get inventory numbers for a specific NetSuite item
   */
  async getInventoryNumbers(tiendaId: number, itemId: number): Promise<ApiResponse<NetsuiteInventoryNumber[]>> {
    const response = await apiClient.get(`/netsuite-inventory/${tiendaId}/items/${itemId}/numbers`)
    return response.data
  },

  /**
   * Save or update an inventory number
   */
  async saveInventoryNumber(tiendaId: number, itemId: number, data: SaveInventoryNumberRequest): Promise<ApiResponse<{ id: number }>> {
    const response = await apiClient.post(`/netsuite-inventory/${tiendaId}/items/${itemId}/numbers`, data)
    return response.data
  },

  /**
   * Update an existing inventory number
   */
  async updateInventoryNumber(tiendaId: number, itemId: number, numberId: number, data: SaveInventoryNumberRequest): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.put(`/netsuite-inventory/${tiendaId}/items/${itemId}/numbers/${numberId}`, data)
    return response.data
  },

  /**
   * Delete an inventory number
   */
  async deleteInventoryNumber(tiendaId: number, itemId: number, numberId: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/netsuite-inventory/${tiendaId}/items/${itemId}/numbers/${numberId}`)
    return response.data
  },

  /**
   * Upload CSV file to bulk import inventory numbers
   */
  async uploadInventoryCsv(tiendaId: number, file: File): Promise<ApiResponse<CsvUploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post(`/netsuite-inventory/${tiendaId}/upload-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
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
    const response = await apiClient.get(`/products/${productId}/netsuite-stock`)
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
    const response = await apiClient.post(`/products/${productId}/sync-stock`)
    return response.data
  },

  /**
   * Sync stock for multiple products in batch (max 50)
   */
  async syncStockBatch(productIds: number[]): Promise<ApiResponse<{
    synced_count: number
    stock_levels: Record<number, number>
  }>> {
    const response = await apiClient.post('/products/sync-stock-batch', {
      product_ids: productIds
    })
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
      local_price: number
      local_price_without_igv: number
      netsuite_price: number | null
      netsuite_price_without_igv: number | null
      price_match: boolean
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
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await apiClient.get(`/netsuite-stock?${queryParams.toString()}`)
    return response.data
  },

  // ========== Tienda-wide NetSuite sync (equivalent to spark sync:stock / sync:prices) ==========

  /**
   * Triggers a full-tienda stock sync from NetSuite. Long-running (~30-90s).
   */
  async syncTiendaStock(dryRun = false): Promise<{
    success: boolean
    dry_run: boolean
    data: any
    finished_at: string
    message?: string
  }> {
    const qs = dryRun ? '?dry_run=1' : ''
    const response = await apiClient.post(`/tienda/sync-stock${qs}`, {}, { timeout: 600000 })
    return response.data
  },

  /**
   * Triggers a full-tienda price sync from NetSuite. Long-running (~60-120s).
   */
  async syncTiendaPrices(dryRun = false): Promise<{
    success: boolean
    dry_run: boolean
    data: any
    finished_at: string
    message?: string
  }> {
    const qs = dryRun ? '?dry_run=1' : ''
    const response = await apiClient.post(`/tienda/sync-prices${qs}`, {}, { timeout: 900000 })
    return response.data
  },

  // ========== Locations API ==========

  /**
   * Get all branches with their NetSuite location IDs
   * Now returns branches from tiendasdirecciones table
   */
  async getLocations(_tiendaId: number): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/netsuite-locations')
    return response.data
  },

  /**
   * Update NetSuite location ID for a branch
   */
  async updateBranchLocation(branchId: number, data: {
    netsuite_location_id: string
  }): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.put(`/netsuite-locations/${branchId}`, data)
    return response.data
  },

  /**
   * Clear NetSuite location ID from a branch
   */
  async clearBranchLocation(branchId: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/netsuite-locations/${branchId}`)
    return response.data
  },

  // ========== Branch-level overrides (series + generic customer per sucursal) ==========

  /**
   * Configuración NetSuite por sucursal (location_id, generic_customer_id, series).
   * Cada sucursal trae sus overrides + flags is_override; defaults vienen aparte.
   */
  async getBranchesConfig(tiendaId: number): Promise<ApiResponse<Array<{
    tiendadireccion_id: number
    branch_name: string
    branch_address: string
    netsuite_location_id: string | null
    generic_customer_id: string | null
    generic_customer_is_override: boolean
    serie_boleta_netsuite_id: string | null
    serie_boleta_is_override: boolean
    serie_factura_netsuite_id: string | null
    serie_factura_is_override: boolean
  }>> & {
    defaults?: {
      generic_customer_id: string | null
      serie_boleta_netsuite_id: string | null
      serie_factura_netsuite_id: string | null
    }
  }> {
    const response = await apiClient.get(`/netsuite-credentials/${tiendaId}/branches-config`, {
      params: { _: Date.now() }
    })
    return response.data
  },

  /**
   * Actualiza overrides por sucursal. Pasar null/'' borra el override.
   */
  async updateBranchConfig(tiendaId: number, branchId: number, data: {
    generic_customer_id?: string | null
    serie_boleta_netsuite_id?: string | null
    serie_factura_netsuite_id?: string | null
  }): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.put(`/netsuite-credentials/${tiendaId}/branches/${branchId}/config`, data)
    return response.data
  },

  /**
   * Elimina override de serie (BOLETA o FACTURA) para una sucursal.
   */
  async deleteBranchSerie(tiendaId: number, branchId: number, tipo: 'BOLETA' | 'FACTURA'): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete(`/netsuite-credentials/${tiendaId}/branches/${branchId}/series/${tipo}`)
    return response.data
  }
}
