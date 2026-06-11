import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

export interface CartRecoveryCupon {
  activo: boolean
  tipo: 'porcentaje' | 'monto'
  valor: number
}

export interface CartRecoveryConfig {
  enabled: boolean
  toques: number
  delays_h: number[]
  cupon: CartRecoveryCupon
}

export interface EspConflict {
  provider: string
  name: string
}

export interface CartRecoveryData {
  config: CartRecoveryConfig
  esp_conflicts: EspConflict[]
}

export interface SaveCartRecoveryRequest {
  enabled: boolean
  toques: number
  delays_h: number[]
  cupon?: CartRecoveryCupon
}

export const cartRecoveryApi = {
  async getConfig(): Promise<ApiResponse<CartRecoveryData>> {
    const response = await apiClient.get('/marketing/cart-recovery')
    return response.data
  },

  async saveConfig(data: SaveCartRecoveryRequest): Promise<ApiResponse<CartRecoveryData>> {
    const response = await apiClient.put('/marketing/cart-recovery', data)
    return response.data
  }
}
