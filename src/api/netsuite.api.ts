import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  NetsuiteCredential,
  SaveNetsuiteCredentialsRequest,
  NetsuiteSerie,
  SaveNetsuiteSerieRequest,
  TestNetsuiteConnectionResponse
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
  }
}
