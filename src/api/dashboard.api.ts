import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { DashboardMetrics, DashboardPeriod } from '@/types/dashboard.types'

export const dashboardApi = {
  // Obtener métricas del dashboard
  async getMetrics(period: DashboardPeriod = 'today'): Promise<ApiResponse<DashboardMetrics>> {
    const response = await apiClient.get(`/util/dashboard-metrics?period=${period}`)
    return response.data
  }
}
