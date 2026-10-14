import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

/** Mes del programa: 1 gratis por inscribirse, 2 por configurar la tienda, 3 por el dominio propio. */
export interface ProgramMonth {
  month: number
  from: string
  until: string
  condition: 'configured' | 'domain' | null
  earned: boolean
  lost: boolean
  met: boolean
}

export interface ProgramStatus {
  program: { code: string; name: string }
  enrolled_at: string
  covered_until: string
  months: ProgramMonth[]
  signals: { products: boolean; payment: boolean; shipping: boolean; configured: boolean; domain: boolean }
  annual_discount: { percent: number; available: boolean }
}

export const programsApi = {
  /** `data: null` si la tienda no está en ningún programa. */
  async getStatus(): Promise<ApiResponse<ProgramStatus | null>> {
    const response = await apiClient.get('/programs/status')
    return { success: true, data: response.data.data ?? null }
  },

  async enroll(code: string): Promise<ApiResponse<ProgramStatus>> {
    const response = await apiClient.post('/programs/enroll', { code })
    return { success: true, data: response.data.data, message: response.data.message }
  }
}
