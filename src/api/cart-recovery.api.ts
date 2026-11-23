import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

export interface CartRecoveryCupon {
  activo: boolean
  tipo: 'porcentaje' | 'monto'
  valor: number
  /** Horas de validez desde el envío del correo (12 a 168). */
  vigencia_h: number
}

export interface CartRecoveryConfig {
  enabled: boolean
  toques: number
  delays_h: number[]
  cupon: CartRecoveryCupon
}

export interface EspConflict {
  provider: string
  name: string
}

export interface CartRecoveryData {
  config: CartRecoveryConfig
  esp_conflicts: EspConflict[]
}

export interface CartRecoverySequenceStats {
  /** Carritos que recibieron al menos un correo en el período. */
  carritos: number
  con_clic: number
  /** Orden pagada del mismo comprador hasta `ventana_atribucion_d` días después del último correo. */
  compras: number
  /** De esas compras, las que pasaron por el enlace del correo. */
  compras_con_clic: number
  /** Sin compra todavía, pero aún dentro de la ventana: pueden convertir. */
  en_curso: number
  monto: number
  monto_con_clic: number
}

export interface CartRecoveryStats {
  dias: number
  ventana_atribucion_d: number
  moneda: string
  moneda_simbolo: string
  carrito: CartRecoverySequenceStats
  pago: CartRecoverySequenceStats
}

export interface SaveCartRecoveryRequest {
  enabled: boolean
  toques: number
  delays_h: number[]
  cupon?: CartRecoveryCupon
}

export const cartRecoveryApi = {
  async getConfig(): Promise<ApiResponse<CartRecoveryData>> {
    const response = await apiClient.get('/marketing/cart-recovery')
    return response.data
  },

  async getStats(dias: 7 | 30 | 90 = 30): Promise<ApiResponse<CartRecoveryStats>> {
    const response = await apiClient.get('/marketing/cart-recovery/stats', { params: { dias } })
    return response.data
  },

  async saveConfig(data: SaveCartRecoveryRequest): Promise<ApiResponse<CartRecoveryData>> {
    const response = await apiClient.put('/marketing/cart-recovery', data)
    return response.data
  }
}
