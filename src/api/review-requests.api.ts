import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

export interface ReviewRequestConfig {
  enabled: boolean
  dias_espera: number
  recordatorio: boolean
  dias_recordatorio: number
}

export interface ReviewRequestStats {
  enviadas: number
  abiertas: number
  respondidas: number
  en_cola: number
}

export interface ReviewRequestData {
  config: ReviewRequestConfig
  stats?: ReviewRequestStats
  /** Pedidos marcados como Entregado en 30 días: sin ellos no sale ningún correo. */
  entregados_30d?: number
}

export const reviewRequestsApi = {
  async getConfig(): Promise<ApiResponse<ReviewRequestData>> {
    const response = await apiClient.get('/marketing/review-requests')
    return response.data
  },

  async saveConfig(data: ReviewRequestConfig): Promise<ApiResponse<ReviewRequestData>> {
    const response = await apiClient.put('/marketing/review-requests', data)
    return response.data
  }
}
