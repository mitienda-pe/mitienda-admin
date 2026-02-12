import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StoreDomainSettings, DnsVerification } from '@/types/domain.types'

export const domainApi = {
  async getSettings(): Promise<ApiResponse<StoreDomainSettings>> {
    const response = await apiClient.get('/store-domain')
    return { success: true, data: response.data.data || response.data }
  },

  async updateDomain(domain: string | null): Promise<ApiResponse<StoreDomainSettings>> {
    const response = await apiClient.put('/store-domain', { tienda_dominio: domain })
    return { success: true, data: response.data.data || response.data }
  },

  async verifyDns(): Promise<ApiResponse<DnsVerification>> {
    const response = await apiClient.get('/store-domain/verify')
    return { success: true, data: response.data.data || response.data }
  }
}
