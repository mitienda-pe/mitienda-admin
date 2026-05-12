import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  PosCajero,
  PosCajeroCreatePayload,
  PosCajeroUpdatePayload,
  PosSucursal,
  PosSucursalesNetsuiteConfigResponse,
  PosSucursalNetsuiteUpdate,
  CheckPinResult
} from '@/types/pos.types'

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export const posApi = {
  // ─── Cajeros ───

  async listCajeros(tiendaId: number): Promise<ApiResponse<PosCajero[]>> {
    const response = await apiClient.get('/pos-empleados', { params: { tienda_id: tiendaId } })
    const data = unwrap<PosCajero[]>(response.data)
    return { success: true, data: Array.isArray(data) ? data : [] }
  },

  async getCajero(id: number): Promise<ApiResponse<PosCajero>> {
    const response = await apiClient.get(`/pos-empleados/${id}`)
    return { success: true, data: unwrap<PosCajero>(response.data) }
  },

  async createCajero(payload: PosCajeroCreatePayload): Promise<ApiResponse<PosCajero>> {
    const response = await apiClient.post('/pos-empleados', payload)
    return { success: true, data: unwrap<PosCajero>(response.data) }
  },

  async updateCajero(id: number, payload: PosCajeroUpdatePayload): Promise<ApiResponse<PosCajero>> {
    const response = await apiClient.put(`/pos-empleados/${id}`, payload)
    return { success: true, data: unwrap<PosCajero>(response.data) }
  },

  async deleteCajero(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/pos-empleados/${id}`)
    return { success: true }
  },

  async checkPin(
    tiendaId: number,
    pin: string,
    excludeEmpleadoId: number | null = null
  ): Promise<ApiResponse<CheckPinResult>> {
    const response = await apiClient.post('/pos-empleados/check-pin', {
      tienda_id: tiendaId,
      pin,
      exclude_empleado_id: excludeEmpleadoId
    })
    return { success: true, data: unwrap<CheckPinResult>(response.data) }
  },

  async asignarSucursal(empleadoId: number, sucursalId: number): Promise<ApiResponse<void>> {
    await apiClient.post(`/pos-empleados/${empleadoId}/sucursales`, { sucursal_id: sucursalId })
    return { success: true }
  },

  async desasignarSucursal(empleadoId: number, sucursalId: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/pos-empleados/${empleadoId}/sucursales/${sucursalId}`)
    return { success: true }
  },

  // ─── Sucursales ───

  async listSucursales(tiendaId: number): Promise<ApiResponse<PosSucursal[]>> {
    const response = await apiClient.get('/branches', { params: { tienda_id: tiendaId } })
    const data = unwrap<PosSucursal[]>(response.data)
    return { success: true, data: Array.isArray(data) ? data : [] }
  },

  // ─── NetSuite por sucursal ───

  async getSucursalesNetsuiteConfig(
    tiendaId: number
  ): Promise<ApiResponse<PosSucursalesNetsuiteConfigResponse>> {
    const response = await apiClient.get(`/netsuite-credentials/${tiendaId}/branches-config`, {
      params: { _: Date.now() }
    })
    return { success: true, data: unwrap<PosSucursalesNetsuiteConfigResponse>(response.data) }
  },

  async updateSucursalNetsuiteConfig(
    tiendaId: number,
    branchId: number,
    payload: PosSucursalNetsuiteUpdate
  ): Promise<ApiResponse<void>> {
    await apiClient.put(`/netsuite-credentials/${tiendaId}/branches/${branchId}/config`, payload)
    return { success: true }
  }
}
