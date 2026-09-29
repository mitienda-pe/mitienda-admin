import apiClient from './axios'

/**
 * Lo que el asistente de compras le responde a los compradores de la tienda.
 *
 * El `tienda_id` sale del token, así que no hay parámetro para pedir las de otra
 * tienda: estos endpoints solo saben devolver las propias.
 */
export interface AssistantTurn {
  id: number
  session_id: string
  mensaje: string
  respuesta: string
  /** Qué consultó para responder. Vacío = respondió sin consultar nada. */
  herramientas: string[]
  productos_mostrados: number
  created_at: string
}

export interface AssistantSummary {
  turnos: number
  conversaciones: number
  /** Turnos que terminaron sin mostrar un solo producto. */
  sin_productos: number
  ultima: string | null
  retencion_dias: number
}

export interface AssistantTurnsPage {
  turns: AssistantTurn[]
  total: number
  retencionDias: number
}

export const assistantConversationsApi = {
  async summary(): Promise<AssistantSummary | null> {
    const { data } = await apiClient.get('/asistente/conversaciones/resumen')
    return data?.data ?? null
  },

  async list(params: {
    pagina?: number
    limite?: number
    buscar?: string
    sesion?: string
  } = {}): Promise<AssistantTurnsPage> {
    const { data } = await apiClient.get('/asistente/conversaciones', { params })
    return {
      turns: data?.data ?? [],
      total: data?.pagination?.total ?? 0,
      retencionDias: data?.pagination?.retencion_dias ?? 30,
    }
  },
}
