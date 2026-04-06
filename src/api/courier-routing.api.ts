import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

export interface CourierRoutingRule {
  rule_id: number
  service_type_id: number
  courier_id: number
  tiendazona_id: number | null
  ubigeo_id: number | null
  rule_prioridad: number
  rule_activo: number
  service_type_code: string
  service_type_nombre: string
  courier_nombre: string
  courier_nombrecorto: string
  zona_nombre: string | null
  ubigeo_nombre: string | null
}

export interface CreateRulePayload {
  service_type_id: number
  courier_id: number
  tiendazona_id?: number | null
  ubigeo_id?: number | null
  rule_prioridad?: number
}

export const courierRoutingApi = {
  async getRules(): Promise<ApiResponse<CourierRoutingRule[]>> {
    const response = await apiClient.get('/courier-routing-rules')
    return { success: response.data?.success ?? true, data: response.data?.data || [] }
  },

  async createRule(data: CreateRulePayload): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/courier-routing-rules', data)
    return { success: response.data?.success ?? false, data: response.data?.data, message: response.data?.message }
  },

  async updateRule(id: number, data: Partial<CreateRulePayload & { rule_activo: number }>): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/courier-routing-rules/${id}`, data)
    return { success: response.data?.success ?? false, data: response.data?.data, message: response.data?.message }
  },

  async deleteRule(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/courier-routing-rules/${id}`)
    return { success: response.data?.success ?? false, data: response.data?.data }
  },

  async preview(ubigeoId: number, serviceTypeId: number): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/courier-routing-rules/preview', {
      params: { ubigeo_id: ubigeoId, service_type_id: serviceTypeId }
    })
    return { success: response.data?.success ?? false, data: response.data?.data }
  },

  async assignCourier(ventaId: number, courierId?: number): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/orders/${ventaId}/assign-courier`, {
      courier_id: courierId || null
    })
    return { success: response.data?.success ?? false, data: response.data?.data, message: response.data?.message }
  },
}
