import apiClient from './axios'
import type { Broadcast } from '@/types/broadcast.types'

export const broadcastsApi = {
  getActive: async (): Promise<Broadcast[]> => {
    const res = await apiClient.get<{ success: boolean; data: Broadcast[] }>(
      '/broadcasts/active'
    )
    return res.data.data || []
  },

  dismiss: async (id: number): Promise<void> => {
    await apiClient.post(`/broadcasts/${id}/dismiss`)
  }
}
