import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  StoreCredential,
  CreateTokenResponse,
  RenewTokenResponse,
  StoreWebhook,
  SaveWebhooksRequest,
  ApiLogSummary
} from '@/types/api-credentials.types'

export const apiCredentialsApi = {
  // ========== API Credentials ==========

  /**
   * Get current store API credentials
   */
  async getCredentials(): Promise<ApiResponse<{ token: string; created_at: string; status: number } | null>> {
    const response = await apiClient.get('/api-credentials')
    return response.data
  },

  /**
   * Create new API token
   */
  async createToken(): Promise<ApiResponse<CreateTokenResponse>> {
    const response = await apiClient.post('/api-credentials/create')
    return response.data
  },

  /**
   * Renew existing API token
   */
  async renewToken(): Promise<ApiResponse<RenewTokenResponse>> {
    const response = await apiClient.post('/api-credentials/renew')
    return response.data
  },

  /**
   * Delete API token
   */
  async deleteToken(): Promise<ApiResponse<any>> {
    const response = await apiClient.delete('/api-credentials')
    return response.data
  },

  // ========== Webhooks ==========

  /**
   * Get all webhooks for current store
   */
  async getWebhooks(): Promise<ApiResponse<StoreWebhook[]>> {
    const response = await apiClient.get('/webhooks')
    return response.data
  },

  /**
   * Get available webhook types
   */
  async getWebhookTypes(): Promise<ApiResponse<Array<{ value: number; label: string }>>> {
    const response = await apiClient.get('/webhooks/types')
    return response.data
  },

  /**
   * Create or update a webhook
   */
  async saveWebhook(tipo: number, url: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/webhooks', {
      tiendawebhook_tipo: tipo,
      tiendawebhook_url: url
    })
    return response.data
  },

  /**
   * Sync multiple webhooks at once
   */
  async syncWebhooks(data: SaveWebhooksRequest): Promise<ApiResponse<any>> {
    const response = await apiClient.put('/webhooks/sync', data)
    return response.data
  },

  /**
   * Delete a webhook by ID
   */
  async deleteWebhook(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/webhooks/${id}`)
    return response.data
  },

  /**
   * Delete a webhook by type
   */
  async deleteWebhookByType(type: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/webhooks/type/${type}`)
    return response.data
  },

  // ========== API Logs ==========
  // Note: These endpoints might need to be implemented in the future
  // as they currently call an external API in the legacy system

  /**
   * Get API logs (placeholder for future implementation)
   */
  async getLogs(limit?: number, offset?: number): Promise<ApiResponse<ApiLogSummary[]>> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    // This might need to be adjusted based on actual API implementation
    const response = await apiClient.get(`/api-logs?${params.toString()}`)
    return response.data
  }
}
