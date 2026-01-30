import api from './axios'
import type {
  CourierProvider,
  CourierProviderConfig,
  SaveCourierConfigRequest,
  CalculatePriceRequest,
  CreateOrderRequest,
} from '@/types/courier-provider.types'

export const courierProvidersApi = {
  async getAll(): Promise<CourierProvider[]> {
    const response = await api.get('/courier-providers')
    return response.data.data
  },

  async getConfig(code: string): Promise<CourierProviderConfig> {
    const response = await api.get(`/courier-providers/${code}`)
    return response.data.data
  },

  async saveConfig(code: string, data: SaveCourierConfigRequest): Promise<void> {
    await api.post(`/courier-providers/${code}`, data)
  },

  async updateConfig(code: string, data: SaveCourierConfigRequest): Promise<void> {
    await api.put(`/courier-providers/${code}`, data)
  },

  async deleteConfig(code: string): Promise<void> {
    await api.delete(`/courier-providers/${code}`)
  },

  async calculatePrice(code: string, data: CalculatePriceRequest): Promise<unknown> {
    const response = await api.post(`/courier-providers/${code}/calculate-price`, data)
    return response.data.data
  },

  async createOrder(code: string, data: CreateOrderRequest): Promise<unknown> {
    const response = await api.post(`/courier-providers/${code}/create-order`, data)
    return response.data.data
  },

  async getUrbanerServices(apiKey: string, environment: string): Promise<unknown> {
    const response = await api.post('/courier-providers/urbaner/services', {
      api_key: apiKey,
      environment,
    })
    return response.data.data
  },
}
