import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  DashboardMetrics,
  DashboardPeriod,
  DashboardAnalytics,
  DashboardFilters
} from '@/types/dashboard.types'
import { ordersApi } from './orders.api'

export const dashboardApi = {
  /**
   * Obtener métricas del dashboard (endpoint legacy)
   */
  async getMetrics(period: DashboardPeriod = 'today'): Promise<ApiResponse<DashboardMetrics>> {
    const response = await apiClient.get(`/util/dashboard-metrics?period=${period}`)

    if (response.data.status === 'success' && response.data.data) {
      const rawData = response.data.data

      // Calcular cambio porcentual para ventas (2 decimales)
      const salesChange =
        rawData.previous_sales.amount > 0
          ? Number(
              (
                ((rawData.today_sales.amount - rawData.previous_sales.amount) /
                  rawData.previous_sales.amount) *
                100
              ).toFixed(2)
            )
          : rawData.today_sales.amount > 0
            ? 100
            : 0

      // Calcular cambio porcentual para ticket promedio (2 decimales)
      const ticketChange =
        rawData.previous_average_ticket > 0
          ? Number(
              (
                ((rawData.average_ticket - rawData.previous_average_ticket) /
                  rawData.previous_average_ticket) *
                100
              ).toFixed(2)
            )
          : rawData.average_ticket > 0
            ? 100
            : 0

      // Obtener pedidos recientes (últimos 10)
      const ordersResponse = await ordersApi.getOrders({ page: 1, limit: 10 })
      const recentOrders = ordersResponse.data || []

      const metrics: DashboardMetrics = {
        sales: {
          amount: rawData.today_sales.amount,
          orders_count: rawData.today_sales.count,
          change: {
            value: rawData.today_sales.amount - rawData.previous_sales.amount,
            percentage: salesChange,
            isPositive: salesChange >= 0
          }
        },
        average_ticket: {
          amount: rawData.average_ticket,
          change: {
            value: rawData.average_ticket - rawData.previous_average_ticket,
            percentage: ticketChange,
            isPositive: ticketChange >= 0
          }
        },
        products: {
          published: rawData.published_products.count,
          total: rawData.published_products.total,
          percentage:
            rawData.published_products.total > 0
              ? Number(
                  (
                    (rawData.published_products.count / rawData.published_products.total) *
                    100
                  ).toFixed(2)
                )
              : 0
        },
        stock: {
          out_of_stock: rawData.out_of_stock_products.count,
          total_published: rawData.out_of_stock_products.total_published,
          percentage:
            rawData.out_of_stock_products.total_published > 0
              ? Number(
                  (
                    (rawData.out_of_stock_products.count /
                      rawData.out_of_stock_products.total_published) *
                    100
                  ).toFixed(2)
                )
              : 0
        },
        recent_orders: recentOrders
      }

      return {
        success: true,
        data: metrics
      }
    }

    return {
      success: false,
      data: undefined
    }
  },

  /**
   * Obtener analíticas completas del dashboard (nuevo endpoint)
   */
  async getAnalytics(filters: DashboardFilters): Promise<ApiResponse<DashboardAnalytics>> {
    const params = new URLSearchParams({
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      compare: filters.compare ? '1' : '0'
    })

    const response = await apiClient.get(`/util/dashboard-analytics?${params.toString()}`)
    const result = response.data

    // Normalize: backend may still return cancellation_rate (pre-migration)
    if (result?.success && result?.data?.scorecards) {
      const sc = result.data.scorecards
      if (sc.cancellation_rate && !sc.rejection_rate) {
        sc.rejection_rate = sc.cancellation_rate
        delete sc.cancellation_rate
      }
    }

    return result
  }
}
