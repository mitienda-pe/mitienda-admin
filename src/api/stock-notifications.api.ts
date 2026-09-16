import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

export interface StockNotificationSummary {
  pendientes: number
  avisados: number
  descartados: number
  lista: { email: string; created_at: string }[]
}

export const stockNotificationsApi = {
  /**
   * GET /api/v1/products/:id/stock-notifications
   * Quienes pidieron el aviso de "ya está disponible" desde la tienda
   */
  async getProductSummary(productId: number): Promise<ApiResponse<StockNotificationSummary>> {
    const response = await apiClient.get(`/products/${productId}/stock-notifications`)
    return response.data
  }
}
