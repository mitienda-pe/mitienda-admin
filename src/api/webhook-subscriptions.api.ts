import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  WebhookSubscription,
  WebhookDelivery,
  AvailableEvent,
  CreateWebhookPayload,
  UpdateWebhookPayload,
  DomainEvent,
  EventStats,
  DashboardData
} from '@/types/webhook-subscriptions.types'

export const webhookSubscriptionsApi = {
  // ========== Webhook Subscriptions ==========

  async getAll(): Promise<ApiResponse<WebhookSubscription[]>> {
    const response = await apiClient.get('/webhook-subscriptions')
    return response.data
  },

  async getById(id: number): Promise<ApiResponse<WebhookSubscription>> {
    const response = await apiClient.get(`/webhook-subscriptions/${id}`)
    return response.data
  },

  async create(data: CreateWebhookPayload): Promise<ApiResponse<WebhookSubscription>> {
    const response = await apiClient.post('/webhook-subscriptions', data)
    return response.data
  },

  async update(id: number, data: UpdateWebhookPayload): Promise<ApiResponse<WebhookSubscription>> {
    const response = await apiClient.put(`/webhook-subscriptions/${id}`, data)
    return response.data
  },

  async remove(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/webhook-subscriptions/${id}`)
    return response.data
  },

  async regenerateSecret(id: number): Promise<ApiResponse<{ secret: string }>> {
    const response = await apiClient.post(`/webhook-subscriptions/${id}/regenerate-secret`)
    return response.data
  },

  async getDeliveries(
    id: number,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<WebhookDelivery[]> & { meta?: any }> {
    const response = await apiClient.get(`/webhook-subscriptions/${id}/deliveries`, {
      params: { page, limit }
    })
    return response.data
  },

  async test(id: number): Promise<ApiResponse<{ delivered: boolean; response_code?: number; error?: string }>> {
    const response = await apiClient.post(`/webhook-subscriptions/${id}/test`)
    return response.data
  },

  async getAvailableEvents(): Promise<ApiResponse<AvailableEvent[]>> {
    const response = await apiClient.get('/webhook-subscriptions/events')
    return response.data
  },

  // ========== Domain Events ==========

  async getEvents(params: {
    page?: number
    limit?: number
    status?: string
    event_type?: string
  }): Promise<ApiResponse<DomainEvent[]> & { meta?: any }> {
    const response = await apiClient.get('/events', { params })
    return response.data
  },

  async getEvent(id: number): Promise<ApiResponse<DomainEvent>> {
    const response = await apiClient.get(`/events/${id}`)
    return response.data
  },

  async getEventStats(): Promise<ApiResponse<EventStats>> {
    const response = await apiClient.get('/events/stats')
    return response.data
  },

  async retryEvent(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.post(`/events/${id}/retry`)
    return response.data
  },

  // ========== Dashboard ==========

  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    const response = await apiClient.get('/events/dashboard')
    return response.data
  }
}
