import type { AnnouncementBar, AnnouncementBarFormData } from '@/types/announcement-bar.types'
import apiClient from './axios'

export const announcementBarsApi = {
  // Obtener todas las barras
  getAll: async (): Promise<AnnouncementBar[]> => {
    const response = await apiClient.get<{ success: boolean; data: AnnouncementBar[] }>(
      '/announcement-bars'
    )
    return response.data.data
  },

  // Obtener barras activas (para frontend)
  getActive: async (): Promise<AnnouncementBar[]> => {
    const response = await apiClient.get<{ success: boolean; data: AnnouncementBar[] }>(
      '/announcement-bars-active'
    )
    return response.data.data
  },

  // Obtener una barra por ID
  getById: async (id: number): Promise<AnnouncementBar> => {
    const response = await apiClient.get<{ success: boolean; data: AnnouncementBar }>(
      `/announcement-bars/${id}`
    )
    return response.data.data
  },

  // Crear nueva barra
  create: async (data: AnnouncementBarFormData): Promise<AnnouncementBar> => {
    const response = await apiClient.post<{ success: boolean; data: AnnouncementBar }>(
      '/announcement-bars',
      data
    )
    return response.data.data
  },

  // Actualizar barra
  update: async (id: number, data: AnnouncementBarFormData): Promise<AnnouncementBar> => {
    const response = await apiClient.put<{ success: boolean; data: AnnouncementBar }>(
      `/announcement-bars/${id}`,
      data
    )
    return response.data.data
  },

  // Eliminar barra
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/announcement-bars/${id}`)
  }
}
