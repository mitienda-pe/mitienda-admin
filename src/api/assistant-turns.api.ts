import apiClient from './axios'

/**
 * El 👍/👎 del comerciante a una respuesta del asistente.
 *
 * El `turno_id` lo genera el backend del asistente y llega en el evento `done`.
 * La API busca el turno por ese id **y** por la tienda del token, así que no se
 * puede votar un turno de otra tienda.
 */
export type AssistantVote = 1 | -1

export const assistantTurnsApi = {
  async vote(turnoId: string, valor: AssistantVote): Promise<void> {
    await apiClient.post(`/asistente/turnos/${encodeURIComponent(turnoId)}/feedback`, { valor })
  },
}
