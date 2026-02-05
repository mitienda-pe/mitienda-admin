import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  StoreInfo,
  StoreInfoUpdateRequest,
  StoreAddress,
  StoreAddressCreateRequest,
  StoreAddressUpdateRequest,
  Rubro
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
  }
}
