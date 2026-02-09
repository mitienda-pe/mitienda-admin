import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  StoreInfo,
  StoreInfoUpdateRequest,
  StoreAddress,
  StoreAddressCreateRequest,
  StoreAddressUpdateRequest,
  Rubro,
  StoreConfig,
  StoreConfigUpdate,
  Currency,
  Country,
  StoreMessages
} from '@/types/store.types'

export const storeApi = {
  // ─── Store Info ───

  async getInfo(): Promise<ApiResponse<StoreInfo>> {
    const response = await apiClient.get('/store-info')
    return { success: true, data: response.data }
  },

  async updateInfo(data: StoreInfoUpdateRequest): Promise<ApiResponse<StoreInfo>> {
    const response = await apiClient.put('/store-info', data)
    return { success: true, data: response.data.data || response.data }
  },

  async getRubros(): Promise<ApiResponse<Rubro[]>> {
    const response = await apiClient.get('/store-info/rubros')
    const rawData = response.data

    if (Array.isArray(rawData)) {
      return { success: true, data: rawData }
    }

    return { success: false, data: [] }
  },

  // ─── Store Addresses ───

  async getAddresses(): Promise<ApiResponse<StoreAddress[]>> {
    const response = await apiClient.get('/store-addresses')
    const rawData = response.data

    if (Array.isArray(rawData)) {
      return { success: true, data: rawData }
    }

    return { success: false, data: [] }
  },

  async getAddress(id: number): Promise<ApiResponse<StoreAddress>> {
    const response = await apiClient.get(`/store-addresses/${id}`)
    return { success: true, data: response.data }
  },

  async createAddress(data: StoreAddressCreateRequest): Promise<ApiResponse<StoreAddress>> {
    const response = await apiClient.post('/store-addresses', data)
    return { success: true, data: response.data }
  },

  async updateAddress(id: number, data: StoreAddressUpdateRequest): Promise<ApiResponse<StoreAddress>> {
    const response = await apiClient.put(`/store-addresses/${id}`, data)
    return { success: true, data: response.data }
  },

  async deleteAddress(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/store-addresses/${id}`)
    return { success: true }
  },

  // ─── Sender Address (Dirección Remitente) ───

  async getSenderAddress(): Promise<ApiResponse<StoreAddress>> {
    const response = await apiClient.get('/store-addresses/sender')
    return { success: true, data: response.data }
  },

  async setSenderAddress(id: number): Promise<ApiResponse<StoreAddress>> {
    const response = await apiClient.patch(`/store-addresses/${id}/set-sender`)
    return { success: true, data: response.data.data || response.data }
  },

  async unsetSenderAddress(id: number): Promise<ApiResponse<StoreAddress>> {
    const response = await apiClient.patch(`/store-addresses/${id}/unset-sender`)
    return { success: true, data: response.data.data || response.data }
  },

  // ─── Store Configuration ───

  async getConfig(): Promise<ApiResponse<StoreConfig>> {
    const response = await apiClient.get('/store-config')
    return { success: true, data: response.data.data || response.data }
  },

  async updateConfig(data: StoreConfigUpdate): Promise<ApiResponse<StoreConfig>> {
    const response = await apiClient.put('/store-config', data)
    return { success: true, data: response.data.data || response.data }
  },

  async getCurrencies(): Promise<ApiResponse<Currency[]>> {
    const response = await apiClient.get('/store-config/currencies')
    const rawData = response.data.data || response.data
    if (Array.isArray(rawData)) {
      return { success: true, data: rawData }
    }
    return { success: false, data: [] }
  },

  async getCountries(): Promise<ApiResponse<Country[]>> {
    const response = await apiClient.get('/ubigeo/countries')
    const rawData = response.data.data || response.data
    if (Array.isArray(rawData)) {
      return { success: true, data: rawData }
    }
    return { success: false, data: [] }
  },

  async uploadConfigBanner(file: File): Promise<ApiResponse<{ banner_url: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/store-config/banner', formData)
    return { success: true, data: response.data.data || response.data }
  },

  async deleteConfigBanner(): Promise<ApiResponse<{ banner_url: null }>> {
    const response = await apiClient.delete('/store-config/banner')
    return { success: true, data: response.data.data || response.data }
  },

  // ─── Store Messages ───

  async getMessages(): Promise<ApiResponse<StoreMessages>> {
    const response = await apiClient.get('/store-messages')
    return { success: true, data: response.data.data || response.data }
  },

  async updateMessages(data: Partial<StoreMessages>): Promise<ApiResponse<StoreMessages>> {
    const response = await apiClient.put('/store-messages', data)
    return { success: true, data: response.data.data || response.data }
  }
}
