import apiClient from './axios'

/**
 * Cambios que el asistente deja preparados y el comerciante aprueba.
 *
 * El asistente nunca cambia nada por su cuenta: propone, y esto es lo que
 * convierte esa propuesta en un hecho. Por eso aprobar es una llamada del panel
 * —autenticada como cualquier otra— y no algo que ocurra dentro de la conversación.
 */
export interface PendingChange {
  cambio_id: number
  tipo: string
  resumen: string
  created_at: string
}

export const assistantChangesApi = {
  async list(): Promise<PendingChange[]> {
    const { data } = await apiClient.get('/asistente/cambios')
    return data?.data ?? []
  },

  async approve(cambioId: number): Promise<void> {
    await apiClient.post(`/asistente/cambios/${cambioId}/aprobar`)
  },

  async reject(cambioId: number): Promise<void> {
    await apiClient.post(`/asistente/cambios/${cambioId}/rechazar`)
  },
}
