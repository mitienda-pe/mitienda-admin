import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

export interface BadgeCounts {
  orders: number
  reviews: number
  complaints: number
  abandoned_carts: number
}

export const badgeCountsApi = {
  async getCounts(): Promise<ApiResponse<BadgeCounts>> {
    const response = await apiClient.get('/badge-counts')
    return response.data
  }
}
