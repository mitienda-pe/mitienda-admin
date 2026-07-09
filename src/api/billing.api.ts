import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  NubefactConfigResponse,
  SaveNubefactCredentialsRequest,
  TestConnectionResponse,
  BizlinksConfigResponse,
  SaveBizlinksCredentialsRequest,
  BillingDocument,
  BillingDocumentDetail,
  BillingDocumentFilters,
  EmitDocumentRequest,
  EmitDocumentResponse,
  ManualEmitRequest,
  ManualEmitResponse,
  ManualDocument,
  DocumentLookupResult,
  BillingStatus
} from '@/types/billing.types'

export const billingApi = {
  // ========== Nubefact API ==========

  /**
   * Get Nubefact configuration for current store
   */
  async getNubefactConfig(): Promise<ApiResponse<NubefactConfigResponse>> {
    const response = await apiClient.get('/billing/nubefact')
    return response.data
  },

  /**
   * Save or update Nubefact credentials
   */
  async saveNubefactCredentials(data: SaveNubefactCredentialsRequest): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/billing/nubefact', data)
    return response.data
  },

  /**
   * Update Nubefact credentials
   */
  async updateNubefactCredentials(data: SaveNubefactCredentialsRequest): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/billing/nubefact', data)
    return response.data
  },

  /**
   * Delete Nubefact credentials
   */
  async deleteNubefactCredentials(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete('/billing/nubefact')
    return response.data
  },

  /**
   * Test Nubefact API connection
   */
  async testNubefactConnection(): Promise<ApiResponse<TestConnectionResponse>> {
    const response = await apiClient.post('/billing/nubefact/test')
    return response.data
  },

  // ========== Bizlinks API (Peru) ==========

  /**
   * Get Bizlinks configuration for current store
   */
  async getBizlinksConfig(): Promise<ApiResponse<BizlinksConfigResponse>> {
    const response = await apiClient.get('/billing/bizlinks')
    return response.data
  },

  /**
   * Save Bizlinks credentials
   */
  async saveBizlinksCredentials(data: SaveBizlinksCredentialsRequest): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/billing/bizlinks', data)
    return response.data
  },

  /**
   * Update Bizlinks credentials
   */
  async updateBizlinksCredentials(data: SaveBizlinksCredentialsRequest): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/billing/bizlinks', data)
    return response.data
  },

  /**
   * Delete Bizlinks credentials
   */
  async deleteBizlinksCredentials(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete('/billing/bizlinks')
    return response.data
  },

  /**
   * Test Bizlinks API connection
   */
  async testBizlinksConnection(): Promise<ApiResponse<TestConnectionResponse>> {
    const response = await apiClient.post('/billing/bizlinks/test')
    return response.data
  },

  // ========== Dátil API (Ecuador/SRI) ==========

  /**
   * Get Dátil configuration for current store
   */
  async getDatilConfig(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/billing/datil')
    return response.data
  },

  /**
   * Save Dátil credentials
   */
  async saveDatilCredentials(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/billing/datil', data)
    return response.data
  },

  /**
   * Update Dátil credentials
   */
  async updateDatilCredentials(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/billing/datil', data)
    return response.data
  },

  /**
   * Delete Dátil credentials
   */
  async deleteDatilCredentials(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete('/billing/datil')
    return response.data
  },

  /**
   * Test Dátil API connection
   */
  async testDatilConnection(): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/billing/datil/test')
    return response.data
  },

  // ========== Billing Documents API ==========

  /**
   * Get the store's electronic billing mode (auto/manual/delegated/none).
   * Used to decide the state of the "Emitir Comprobante" action.
   */
  async getStatus(): Promise<ApiResponse<BillingStatus>> {
    const response = await apiClient.get('/billing/status')
    return response.data
  },

  /**
   * Get list of emitted billing documents
   */
  async getDocuments(limit?: number, offset?: number, filters?: BillingDocumentFilters): Promise<ApiResponse<BillingDocument[]> & {
    pagination?: { total: number; limit: number; offset: number }
  }> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    if (filters?.date_from) params.append('date_from', filters.date_from)
    if (filters?.date_to) params.append('date_to', filters.date_to)
    if (filters?.document_type) params.append('document_type', filters.document_type)
    if (filters?.search) params.append('search', filters.search)

    const response = await apiClient.get(`/billing/documents?${params.toString()}`)
    return response.data
  },

  /**
   * Export emitted billing documents as CSV (respects the active filters).
   * Returns the raw CSV Blob so the caller can trigger a download.
   */
  async exportDocuments(filters?: BillingDocumentFilters): Promise<Blob> {
    const params = new URLSearchParams()
    if (filters?.date_from) params.append('date_from', filters.date_from)
    if (filters?.date_to) params.append('date_to', filters.date_to)
    if (filters?.document_type) params.append('document_type', filters.document_type)
    if (filters?.search) params.append('search', filters.search)

    const response = await apiClient.get(`/billing/documents/export?${params.toString()}`, {
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Get billing document detail
   */
  async getDocumentDetail(id: number): Promise<ApiResponse<BillingDocumentDetail>> {
    const response = await apiClient.get(`/billing/documents/${id}`)
    return response.data
  },

  /**
   * Emit billing document for an order
   */
  async emitDocument(data: EmitDocumentRequest): Promise<ApiResponse<EmitDocumentResponse>> {
    const response = await apiClient.post('/billing/documents/emit', data)
    return response.data
  },

  // ========== Manual Billing API ==========

  /**
   * Emit manual billing document (without order)
   */
  async emitManualDocument(data: ManualEmitRequest): Promise<ApiResponse<ManualEmitResponse>> {
    const response = await apiClient.post('/billing/manual/emit', data)
    return response.data
  },

  /**
   * Get list of manual billing documents
   */
  async getManualDocuments(limit?: number, offset?: number): Promise<ApiResponse<ManualDocument[]> & {
    pagination?: { total: number; limit: number; offset: number }
  }> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    const response = await apiClient.get(`/billing/manual?${params.toString()}`)
    return response.data
  },

  /**
   * Get manual billing document detail
   */
  async getManualDocumentDetail(id: number): Promise<ApiResponse<ManualDocument>> {
    const response = await apiClient.get(`/billing/manual/${id}`)
    return response.data
  },

  // ========== Document Lookup API (DeColecta) ==========

  /**
   * Lookup DNI or RUC via DeColecta
   */
  async lookupDocument(documentNumber: string, type: 'dni' | 'ruc'): Promise<ApiResponse<DocumentLookupResult>> {
    const response = await apiClient.get(`/customers/lookup/${documentNumber}?type=${type}`)
    return response.data
  },

  /**
   * Search products for autocomplete
   */
  async searchProducts(query: string, limit: number = 10): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get(`/products?search=${encodeURIComponent(query)}&limit=${limit}`)
    return response.data
  }
}
