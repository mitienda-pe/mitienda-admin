export type DispatchStateId = 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39

export interface DispatchState {
  id: DispatchStateId
  name: string
  slug?: string
}

export interface DispatchOrder {
  order_id: number
  order_code: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  ubigeo: string
  delivery_type: 'domicilio' | 'retiro'
  order_date: string
  delivery_date: string | null
  dispatch_state: DispatchState
  tracking_code: string | null
  tracking_url: string | null
  items_count: number
  payment_status: number
  pasarela_id: number
  fulfillment_provider: string | null
}

export interface DispatchOrderDetail {
  order_id: number
  order_code: string
  customer: {
    name: string
    email: string
    phone: string
  }
  recipient: {
    name: string
    phone: string
  }
  delivery: {
    type: 'domicilio' | 'retiro'
    address: string
    reference: string
    ubigeo: string
    scheduled_date: string | null
    shipped_date: string | null
  }
  tracking: {
    code: string | null
    url: string | null
  }
  dispatch_state: DispatchState
  available_transitions: number[]
  order_date: string
  payment_status: number
  pasarela_id: number
  observation: string
  items: DispatchOrderItem[]
  timeline: DispatchTimelineEntry[]
  total?: number
  fulfillment_provider: string | null
}

export interface DispatchOrderItem {
  sku: string
  name: string
  quantity: number
  image: string | null
  price?: number
}

export interface DispatchTimelineEntry {
  id: number
  state_id: number
  state_name: string
  user_name: string | null
  comentario_cliente: string | null
  observacion_reparto: string | null
  customer_notified: boolean
  date: string
}

export interface DispatchStatusChange {
  state_id: DispatchStateId
  comentario_cliente?: string
  observacion_reparto?: string
  notify_customer?: boolean
}

export interface DispatchBatchStatusChange {
  order_ids: number[]
  state_id: DispatchStateId
  comentario_cliente?: string
  notify_customer?: boolean
}

export interface DispatchStats {
  [stateId: string]: { count: number; name: string }
}

export interface DispatchOrdersFilters {
  dispatch_state?: string
  delivery_type?: 'domicilio' | 'retiro' | 'all'
  search?: string
  date_from?: string
  date_to?: string
  delivery_date?: string
  department?: string
  province?: string
  district?: string
  include_pending_payment?: string
  include_confirmed_payment?: string
  page?: number
  per_page?: number
}

export interface DispatchBatchResult {
  total: number
  success: number
  errors: number
  details: Array<{
    order_id: number
    success: boolean
    message: string
  }>
}
