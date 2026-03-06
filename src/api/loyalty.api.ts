import apiClient from './axios'
import type {
  LoyaltyProgram,
  LoyaltyDashboard,
  LoyaltyAccount,
  LoyaltyEntry,
  LoyaltyCustomerStatus,
  IntegrityResult,
  CorrectionPayload,
} from '@/types/loyalty.types'

export const loyaltyApi = {
  async getProgram(): Promise<LoyaltyProgram> {
    const response = await apiClient.get('/loyalty/program')
    return response.data.data
  },

  async saveProgram(data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    const response = await apiClient.post('/loyalty/program', data)
    return response.data.data
  },

  async getDashboard(): Promise<LoyaltyDashboard> {
    const response = await apiClient.get('/loyalty/dashboard')
    return response.data.data
  },

  async getCustomers(params: { search?: string; page?: number } = {}): Promise<{
    data: LoyaltyAccount[]
    pagination: { page: number; per_page: number; total: number; pages: number }
  }> {
    const response = await apiClient.get('/loyalty/customers', { params })
    return response.data
  },

  async getCustomerDetail(customerId: number): Promise<LoyaltyCustomerStatus> {
    const response = await apiClient.get(`/loyalty/customers/${customerId}`)
    return response.data.data
  },

  async getCustomerHistory(
    customerId: number,
    params: { page?: number } = {}
  ): Promise<{
    data: LoyaltyEntry[]
    pagination: { page: number; per_page: number; total: number; pages: number }
  }> {
    const response = await apiClient.get(`/loyalty/customers/${customerId}/history`, { params })
    return response.data
  },

  async applyCorrection(customerId: number, data: CorrectionPayload): Promise<any> {
    const response = await apiClient.post(`/loyalty/customers/${customerId}/correction`, data)
    return response.data
  },

  async verifyIntegrity(customerId: number): Promise<IntegrityResult> {
    const response = await apiClient.get(`/loyalty/customers/${customerId}/integrity`)
    return response.data.data
  },
}
