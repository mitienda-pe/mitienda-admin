import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  NubefactConfigResponse,
  SaveNubefactCredentialsRequest,
  TestConnectionResponse,
  BillingDocument,
  BillingDocumentDetail,
  EmitDocumentRequest,
  EmitDocumentResponse,
  ManualEmitRequest,
  ManualEmitResponse,
  ManualDocument,
  DocumentLookupResult
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

  // ========== Billing Documents API ==========

  /**
   * Get list of emitted billing documents
   */
  async getDocuments(limit?: number, offset?: number): Promise<ApiResponse<BillingDocument[]> & {
    pagination?: { total: number; limit: number; offset: number }
  }> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    const response = await apiClient.get(`/billing/documents?${params.toString()}`)
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
