import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

export interface BranchStockItem {
  producto_id: number
  sku: string
  nombre: string
  tiene_variantes: boolean
  stock_ilimitado: boolean
  stock_sucursal: number
  stock_agregado: number
}

export interface BranchStockPagination {
  page: number
  per_page: number
  total_items: number
  total_pages: number
}

export interface BranchStockListResult {
  items: BranchStockItem[]
  pagination: BranchStockPagination
}

export interface BranchStockAdjustItem {
  producto_id: number
  productoatributo_id?: number
  stock: number
}

export interface BranchStockSaveResult {
  updated: number
  results: Array<{
    producto_id: number
    productoatributo_id: number
    stock_anterior: number
    stock_resultante: number
  }>
  errors: Array<{ index?: number; producto_id?: number; message: string }>
}

export interface BranchStockImportResult {
  processed: number
  updated: number
  errors: Array<{ row: number; message: string }>
}

interface BranchStockListParams {
  tiendadireccion_id: number
  search?: string
  page?: number
}

export const branchStockApi = {
  async list(params: BranchStockListParams): Promise<ApiResponse<BranchStockListResult>> {
    const qs = new URLSearchParams()
    qs.append('tiendadireccion_id', String(params.tiendadireccion_id))
    if (params.search) qs.append('search', params.search)
    if (params.page) qs.append('page', String(params.page))

    const response = await apiClient.get(`/branch-stock?${qs.toString()}`)
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  async save(
    tiendadireccionId: number,
    items: BranchStockAdjustItem[]
  ): Promise<ApiResponse<BranchStockSaveResult>> {
    const response = await apiClient.put('/branch-stock', {
      tiendadireccion_id: tiendadireccionId,
      items
    })
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  async importCsv(file: File, tiendadireccionId: number): Promise<ApiResponse<BranchStockImportResult>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tiendadireccion_id', String(tiendadireccionId))
    const response = await apiClient.post('/branch-stock/import', formData)
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  // ─── Activación (flag tiendageneral_sw_stock_nativo_sucursal en /store-config) ───

  async getActivation(): Promise<ApiResponse<{ enabled: boolean }>> {
    const response = await apiClient.get('/store-config')
    const cfg = response.data?.data ?? response.data ?? {}
    return { success: true, data: { enabled: Number(cfg.tiendageneral_sw_stock_nativo_sucursal) === 1 } }
  },

  /**
   * Activa/desactiva la gestión nativa. El backend valida la elegibilidad
   * (plan Large/PDV + sin NetSuite) y devuelve error si no aplica.
   */
  async setActivation(enabled: boolean): Promise<ApiResponse<{ enabled: boolean }>> {
    const response = await apiClient.put('/store-config', {
      tiendageneral_sw_stock_nativo_sucursal: enabled ? 1 : 0
    })
    const cfg = response.data?.data ?? response.data ?? {}
    return { success: true, data: { enabled: Number(cfg.tiendageneral_sw_stock_nativo_sucursal) === 1 } }
  }
}
