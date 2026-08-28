import apiClient from './axios'
import type { PaginationMeta } from '@/types/api.types'
import type {
  CreatePaymentLinkPayload,
  PaymentLink,
  PaymentLinkEstado,
  PaymentLinkOrder,
} from '@/types/payment-link.types'

/**
 * API de links de pago.
 *
 * El interceptor de axios normaliza `{ error: 0, data }` → `{ success, data }` y
 * preserva `pagination`.
 */
export const paymentLinksApi = {
  /** Listado paginado. `estado` filtra por el estado GUARDADO, no por `bloqueo`. */
  async list(
    params: { page?: number; limit?: number; estado?: PaymentLinkEstado } = {},
  ): Promise<{ data: PaymentLink[]; pagination: PaginationMeta; afectacionSugerida: number }> {
    const search = new URLSearchParams()
    if (params.page) search.append('page', String(params.page))
    if (params.limit) search.append('limit', String(params.limit))
    if (params.estado) search.append('estado', params.estado)
    const response = await apiClient.get(`/payment-links?${search.toString()}`)
    return {
      data: response.data.data,
      pagination: response.data.pagination,
      // Afectación con la que la tienda ya factura: precarga el selector de
      // conceptos para no imponerle "gravado" a quien vende exonerado.
      afectacionSugerida: Number(response.data.afectacion_sugerida ?? 1),
    }
  },

  async get(id: number): Promise<PaymentLink> {
    const response = await apiClient.get(`/payment-links/${id}`)
    return response.data.data
  },

  async create(payload: CreatePaymentLinkPayload): Promise<PaymentLink> {
    const response = await apiClient.post('/payment-links', payload)
    return response.data.data
  },

  /**
   * Editar NO cambia el código: los links ya compartidos por WhatsApp siguen
   * vivos. Un link con cobros hechos rechaza el cambio de ítems con 409.
   */
  async update(id: number, payload: Partial<CreatePaymentLinkPayload>): Promise<PaymentLink> {
    const response = await apiClient.put(`/payment-links/${id}`, payload)
    return response.data.data
  },

  /**
   * Pausar o reactivar. Solo acepta `activo` / `pausado`: un link vencido o
   * agotado no se reactiva por aquí, hay que ampliarle la vigencia o el cupo.
   */
  async setEstado(id: number, estado: 'activo' | 'pausado'): Promise<PaymentLink> {
    const response = await apiClient.post(`/payment-links/${id}/estado`, { estado })
    return response.data.data
  },

  /** Anula (borrado lógico). Las ventas ya cobradas siguen apuntando al link. */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`/payment-links/${id}`)
  },

  /** Ventas generadas por este link. */
  async orders(id: number): Promise<PaymentLinkOrder[]> {
    const response = await apiClient.get(`/payment-links/${id}/ordenes`)
    return response.data.data
  },

  /** Búsqueda de productos para armar el link. */
  async searchProducts(query: string, limit = 20): Promise<any[]> {
    const response = await apiClient.get(
      `/products?search=${encodeURIComponent(query)}&limit=${limit}`,
    )
    return response.data.data ?? []
  },
}
