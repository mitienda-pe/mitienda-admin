import type { AnnouncementPopup, AnnouncementPopupPayload } from '@/types/announcement-popup.types'
import apiClient from './axios'

export const announcementPopupsApi = {
  getAll: async (): Promise<AnnouncementPopup[]> => {
    const response = await apiClient.get<{ data: AnnouncementPopup[] }>('/announcement-popups')
    return response.data.data
  },

  getById: async (id: number): Promise<AnnouncementPopup> => {
    const response = await apiClient.get<{ data: AnnouncementPopup }>(`/announcement-popups/${id}`)
    return response.data.data
  },

  create: async (data: AnnouncementPopupPayload): Promise<AnnouncementPopup> => {
    const response = await apiClient.post<{ data: AnnouncementPopup }>('/announcement-popups', data)
    return response.data.data
  },

  update: async (id: number, data: AnnouncementPopupPayload): Promise<AnnouncementPopup> => {
    const response = await apiClient.put<{ data: AnnouncementPopup }>(`/announcement-popups/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/announcement-popups/${id}`)
  },

  // Sube la imagen antes de guardar el popup; devuelve la URL pública.
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiClient.post<{ data: { url: string } }>('/announcement-popups/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data.url
  }
}
