export type FulfillmentStatus = 'not_sent' | 'sent' | 'error' | 'processing' | 'unknown'

export interface FulfillmentInfo {
  status: FulfillmentStatus
  status_code: number
  tracking_code: string | null
  shipping_status?: number
  message: string | null
  provider: string | null
}

export interface FulfillmentOrder {
  order_id: number
  order_code: string
  customer: string
  total: number
  created_at: string
  fulfillment: FulfillmentInfo
}

export interface FulfillmentProvider {
  code: string
  name: string
  enabled: boolean
  configured: boolean
}

export interface FulfillmentSendResult {
  success: boolean
  tracking: string | null
  message: string
}

export interface FulfillmentBulkResult {
  results: Array<FulfillmentSendResult & { order_id: number }>
  success: number
  errors: number
  total: number
  message: string
}

export interface FulfillmentOrdersFilters {
  status?: 'all' | 'not_sent' | 'sent' | 'error' | 'processing'
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  per_page?: number
}

/**
 * Fila del snapshot de stock de Flexy WMS (Sharf).
 *
 * Forma distinta a la de Urbano: Flexy devuelve una cantidad plana por código,
 * sin desglose de disponible/reservado. Y **no incluye los agotados** — saca del
 * feed lo que está en cero en vez de reportarlo con 0, así que la ausencia de un
 * código no significa que Sharf no lo despache.
 */
export interface FlexyStockItem {
  codigo_producto: string
  producto?: string
  cantidad: number
}
