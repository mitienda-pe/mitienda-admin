import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  NotificationsData,
  EmailNotification,
  SaveEmailRequest,
  OneSignalSubscribeRequest,
  OneSignalUnsubscribeRequest,
  OneSignalStatusResponse
} from '@/types/notifications.types'

export const notificationsApi = {
  async getAll(): Promise<ApiResponse<NotificationsData>> {
    const response = await apiClient.get('/notifications')
    return response.data
  },

  async saveEmail(data: SaveEmailRequest): Promise<ApiResponse<EmailNotification>> {
    const response = await apiClient.post('/notifications/email', data)
    return response.data
  },

  async deleteNotification(id: number): Promise<ApiResponse> {
    const response = await apiClient.delete(`/notifications/${id}`)
    return response.data
  },

  async onesignalSubscribe(
    data: OneSignalSubscribeRequest
  ): Promise<ApiResponse<{ id: number; player_id: string; browser: string }>> {
    const response = await apiClient.post('/notifications/onesignal/subscribe', data)
    return response.data
  },

  async onesignalUnsubscribe(data: OneSignalUnsubscribeRequest): Promise<ApiResponse> {
    const response = await apiClient.post('/notifications/onesignal/unsubscribe', data)
    return response.data
  },

  async onesignalStatus(playerId: string): Promise<ApiResponse<OneSignalStatusResponse>> {
    const response = await apiClient.post('/notifications/onesignal/status', {
      player_id: playerId
    })
    return response.data
  }
}
