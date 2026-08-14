import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

/** Tipos de movimiento que el comerciante puede registrar a mano. */
export type ManualMovementType = 'entrada' | 'salida' | 'merma'

export type MovementType =
  | ManualMovementType
  | 'ajuste'
  | 'import'
  | 'reconcile'
  | 'devolucion'
  | 'venta'
  | 'venta_reversa'
  | 'transferencia_salida'
  | 'transferencia_entrada'

export interface Warehouse {
  id: number
  nombre: string
  es_almacen: boolean
  publicado: boolean
  productos: number
}

export interface KardexMovement {
  id: number
  fecha: string
  tipo: MovementType
  producto_id: number
  producto: string | null
  sku: string | null
  productoatributo_id: number
  almacen_id: number
  almacen: string | null
  contraparte_id: number | null
  contraparte: string | null
  cantidad: number
  stock_anterior: number
  stock_resultante: number
  referencia: string | null
  motivo: string | null
  venta_id: number | null
  venta_codigo: string | null
  transferencia_id: number | null
  usuario_id: number | null
}

export interface InventoryPagination {
  page: number
  per_page: number
  total_items: number
  total_pages: number
}

export interface KardexResult {
  items: KardexMovement[]
  pagination: InventoryPagination
}

export interface MovementLine {
  producto_id: number
  productoatributo_id?: number
  cantidad: number
}

export interface MovementResult {
  tipo: ManualMovementType
  almacen_id: number
  aplicados: number
  resultados: Array<{
    producto_id: number
    productoatributo_id: number
    stock_anterior: number
    stock_resultante: number
  }>
  errores: Array<{ index?: number; producto_id?: number; message: string }>
}

export interface Transfer {
  id: number
  fecha: string
  estado: 'confirmada' | 'anulada'
  origen_id: number
  origen: string | null
  destino_id: number
  destino: string | null
  items_count: number
  unidades_total: number
  nota: string | null
  usuario_id: number | null
}

export interface TransferDetail {
  transferencia: Transfer
  movimientos: Array<{
    id: number
    tipo: MovementType
    producto_id: number
    producto: string | null
    sku: string | null
    productoatributo_id: number
    almacen_id: number
    cantidad: number
    stock_anterior: number
    stock_resultante: number
  }>
}

export interface TransferShortage {
  producto_id: number
  productoatributo_id: number
  solicitado: number
  disponible: number
}

export interface WarehouseVariantStock {
  productoatributo_id: number
  nombre: string | null
  stock: number
  stock_ilimitado: boolean
}

export interface WarehouseProductStock {
  almacen_id: number
  producto: {
    producto_id: number
    nombre: string | null
    sku: string | null
    stock: number
    stock_ilimitado: boolean
    /** true = el saldo es del almacén; false = es el agregado de la tienda. */
    por_almacen: boolean
  } | null
  variantes: WarehouseVariantStock[]
}

export interface KardexFilters {
  producto_id?: number | null
  almacen_id?: number | null
  tipo?: MovementType | null
  desde?: string | null
  hasta?: string | null
  page?: number
  per_page?: number
}

/**
 * Etiquetas y color de cada tipo de movimiento. El signo ya viene en
 * `cantidad`, así que el color solo separa lo que suma de lo que resta.
 */
export const MOVEMENT_LABELS: Record<MovementType, string> = {
  entrada: 'Ingreso',
  salida: 'Salida',
  merma: 'Merma',
  ajuste: 'Ajuste',
  import: 'Importación',
  reconcile: 'Reconciliación',
  devolucion: 'Devolución',
  venta: 'Venta',
  venta_reversa: 'Anulación de venta',
  transferencia_salida: 'Transferencia (salida)',
  transferencia_entrada: 'Transferencia (entrada)'
}

export const inventoryApi = {
  async warehouses(): Promise<ApiResponse<{ items: Warehouse[]; default_id: number }>> {
    const response = await apiClient.get('/inventory/warehouses')
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  async kardex(filters: KardexFilters = {}): Promise<ApiResponse<KardexResult>> {
    const qs = new URLSearchParams()
    if (filters.producto_id) qs.append('producto_id', String(filters.producto_id))
    if (filters.almacen_id) qs.append('almacen_id', String(filters.almacen_id))
    if (filters.tipo) qs.append('tipo', filters.tipo)
    if (filters.desde) qs.append('desde', filters.desde)
    if (filters.hasta) qs.append('hasta', filters.hasta)
    if (filters.page) qs.append('page', String(filters.page))
    if (filters.per_page) qs.append('per_page', String(filters.per_page))

    const response = await apiClient.get(`/inventory/kardex?${qs.toString()}`)
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  /** Saldo del producto y de sus variantes en un almacén. */
  async stock(productoId: number, almacenId?: number | null): Promise<ApiResponse<WarehouseProductStock>> {
    const qs = new URLSearchParams({ producto_id: String(productoId) })
    if (almacenId) qs.append('almacen_id', String(almacenId))

    const response = await apiClient.get(`/inventory/stock?${qs.toString()}`)
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  async createMovement(payload: {
    tipo: ManualMovementType
    almacen_id: number
    motivo?: string
    items: MovementLine[]
  }): Promise<ApiResponse<MovementResult>> {
    const response = await apiClient.post('/inventory/movements', payload)
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  async transfers(page = 1): Promise<ApiResponse<{ items: Transfer[]; pagination: InventoryPagination }>> {
    const response = await apiClient.get(`/inventory/transfers?page=${page}`)
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  async transfer(id: number): Promise<ApiResponse<TransferDetail>> {
    const response = await apiClient.get(`/inventory/transfers/${id}`)
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  async createTransfer(payload: {
    origen_id: number
    destino_id: number
    nota?: string
    items: MovementLine[]
  }): Promise<ApiResponse<{ id: number; items_count: number; unidades_total: number }>> {
    const response = await apiClient.post('/inventory/transfers', payload)
    const data = response.data?.data ?? response.data
    return { success: true, data }
  },

  // ─── Activación (flag tiendageneral_sw_inventario en /store-config) ───

  async getActivation(): Promise<ApiResponse<{ enabled: boolean }>> {
    const response = await apiClient.get('/store-config')
    const cfg = response.data?.data ?? response.data ?? {}
    return { success: true, data: { enabled: Number(cfg.tiendageneral_sw_inventario) === 1 } }
  },

  /**
   * El backend valida la elegibilidad (módulo del plan o add-on por tienda, y
   * que la tienda no use un ERP) y responde con error si no aplica.
   */
  async setActivation(enabled: boolean): Promise<ApiResponse<{ enabled: boolean }>> {
    const response = await apiClient.put('/store-config', {
      tiendageneral_sw_inventario: enabled ? 1 : 0
    })
    const cfg = response.data?.data ?? response.data ?? {}
    return { success: true, data: { enabled: Number(cfg.tiendageneral_sw_inventario) === 1 } }
  }
}
