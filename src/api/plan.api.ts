import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StorePlanInfo } from '@/types/plan.types'

export const planApi = {
  async getMyPlan(): Promise<ApiResponse<StorePlanInfo>> {
    const response = await apiClient.get('/planes/mi-plan')
    return response.data
  }
}
