import apiClient from './axios'
import type {
  DispatchOrder,
  DispatchOrderDetail,
  DispatchState,
  DispatchStats,
  DispatchStatusChange,
  DispatchBatchStatusChange,
  DispatchBatchResult,
  DispatchTimelineEntry,
  DispatchOrdersFilters
} from '@/types/dispatch.types'

// Response type after Axios interceptor normalization (error → success)
interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
  [key: string]: unknown // pagination, etc.
}

export const dispatchApi = {
  /** List orders with dispatch status (paginated, filtered) */
  async getOrders(filters: DispatchOrdersFilters = {}): Promise<ApiResponse<DispatchOrder[]> & {
    pagination: { page: number; per_page: number; total: number; pages: number }
  }> {
    const response = await apiClient.get('/dispatch/orders', { params: filters })
    return response.data
  },

  /** Get single order detail for dispatch */
  async getOrder(orderId: number, mode?: 'picking'): Promise<ApiResponse<DispatchOrderDetail>> {
    const params = mode ? { mode } : {}
    const response = await apiClient.get(`/dispatch/orders/${orderId}`, { params })
    return response.data
  },

  /** Change dispatch status for a single order */
  async updateStatus(orderId: number, payload: DispatchStatusChange): Promise<ApiResponse<null>> {
    const response = await apiClient.put(`/dispatch/orders/${orderId}/status`, payload)
    return response.data
  },

  /** Batch change dispatch status for multiple orders */
  async batchUpdateStatus(payload: DispatchBatchStatusChange): Promise<ApiResponse<DispatchBatchResult>> {
    const response = await apiClient.post('/dispatch/orders/batch-status', payload)
    return response.data
  },

  /** Get dispatch state timeline for an order */
  async getTimeline(orderId: number): Promise<ApiResponse<DispatchTimelineEntry[]>> {
    const response = await apiClient.get(`/dispatch/orders/${orderId}/timeline`)
    return response.data
  },

  /** Get dispatch state catalog (30-39) */
  async getStates(): Promise<ApiResponse<DispatchState[]>> {
    const response = await apiClient.get('/dispatch/states')
    return response.data
  },

  /** Get count of orders per dispatch state */
  async getStats(): Promise<ApiResponse<DispatchStats>> {
    const response = await apiClient.get('/dispatch/stats')
    return response.data
  }
}
