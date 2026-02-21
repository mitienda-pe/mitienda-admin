import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  IntegrationProvider,
  IntegrationProviderConfig,
  SaveIntegrationProviderRequest,
  TestConnectionResult
} from '@/types/integration-provider.types'

export const integrationProvidersApi = {
  async getAll(): Promise<ApiResponse<IntegrationProvider[]>> {
    const response = await apiClient.get('/integration-providers')
    return response.data
  },

  async getConfig(code: string): Promise<ApiResponse<IntegrationProviderConfig>> {
    const response = await apiClient.get(`/integration-providers/${code}`)
    return response.data
  },

  async saveConfig(
    code: string,
    data: SaveIntegrationProviderRequest
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post(`/integration-providers/${code}`, data)
    return response.data
  },

  async updateConfig(
    code: string,
    data: SaveIntegrationProviderRequest
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.put(`/integration-providers/${code}`, data)
    return response.data
  },

  async deleteConfig(code: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete(`/integration-providers/${code}`)
    return response.data
  },

  async testConnection(code: string): Promise<ApiResponse<TestConnectionResult>> {
    const response = await apiClient.post(`/integration-providers/${code}/test`)
    return response.data
  },

  async toggleProvider(
    code: string
  ): Promise<ApiResponse<{ enabled: boolean; message: string }>> {
    const response = await apiClient.put(`/integration-providers/${code}/toggle`)
    return response.data
  }
}
