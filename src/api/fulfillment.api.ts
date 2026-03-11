import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  FulfillmentProvider,
  FulfillmentSendResult,
  FulfillmentBulkResult,
  FulfillmentOrder,
  FulfillmentOrdersFilters,
  FulfillmentInfo
} from '@/types/fulfillment.types'

export const fulfillmentApi = {
  /** Get the configured fulfillment provider for this store */
  async getProvider(): Promise<ApiResponse<FulfillmentProvider | null>> {
    const response = await apiClient.get('/fulfillment/provider')
    return response.data
  },

  /** Send an order to the fulfillment provider */
  async sendToFulfillment(orderId: number, force = false): Promise<ApiResponse<FulfillmentSendResult>> {
    const response = await apiClient.post('/fulfillment/send', { order_id: orderId, force })
    return response.data
  },

  /** Send multiple orders in batch */
  async sendBulk(orderIds: number[], force = false): Promise<ApiResponse<FulfillmentBulkResult>> {
    const response = await apiClient.post('/fulfillment/send-bulk', { order_ids: orderIds, force })
    return response.data
  },

  /** Get fulfillment status for a specific order */
  async getStatus(orderId: number): Promise<ApiResponse<{ order_id: number; order_code: string; fulfillment: FulfillmentInfo }>> {
    const response = await apiClient.get(`/fulfillment/status/${orderId}`)
    return response.data
  },

  /** List orders with fulfillment status (paginated) */
  async getOrders(filters: FulfillmentOrdersFilters = {}): Promise<{
    error: number
    data: FulfillmentOrder[]
    pagination: { page: number; per_page: number; total: number; pages: number }
  }> {
    const response = await apiClient.get('/fulfillment/orders', { params: filters })
    return response.data
  },

  // ─── WMS-specific endpoints (Urbano WMS) ─────────────────

  /** Get stock from WMS */
  async getWmsStock(params?: { sku?: string; stage?: string; storage?: string }): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/urbano-wms/stock', { params })
    return response.data
  },

  /** Sync tracking for pending orders */
  async syncTracking(): Promise<ApiResponse<{ updated: number; total: number; errors: number }>> {
    const response = await apiClient.post('/urbano-wms/sync-tracking')
    return response.data
  },

  /** Sync stock from WMS to products */
  async syncStock(storage = 'MTZ'): Promise<ApiResponse<{ updated: number; total: number; not_found: number }>> {
    const response = await apiClient.post('/urbano-wms/sync-stock', { storage })
    return response.data
  },

  /** Get tracking info for a specific order */
  async getTracking(trackingWms: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/urbano-wms/tracking', { params: { tracking_wms: trackingWms } })
    return response.data
  }
}
