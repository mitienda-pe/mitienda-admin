// Tipos de pedidos
export interface Order {
  id: number
  order_number: string
  customer: Customer
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  shipping_cost?: number
  tax: number
  total: number
  rounding_amount?: number // Monto del redondeo aplicado (puede ser positivo o negativo)
  total_after_rounding?: number // Total después de aplicar el redondeo
  status: OrderStatus
  payment_method: string
  payment_status: string
  payment_gateway?: string
  payments?: OrderPayment[] // For POS sales with multiple payment methods
  gateway_code?: string
  gateway_message?: string
  shipping_address?: Address | string
  shipping_details?: ShippingDetails
  billing_address?: Address
  notes?: string
  tiendaventa_estado_notif_erp?: number // 0 = success, 1 = error
  tiendaventa_mensaje_notif_erp?: string
  billing_document?: BillingDocument
  created_at: string
  updated_at: string
}

export interface OrderPayment {
  method: string
  method_name: string
  amount: string
  reference?: string | null
  authorization_number?: string | null
}

export interface BillingDocument {
  id: number
  status: number // 0 = no emitido, 1 = emitido
  billing_date: string | null
  serie: string
  correlative: string
  document_type?: string // factura, boleta
  pdf_url?: string
  xml_url?: string
}

export interface ShippingDetails {
  cost: string
  address: string
  address_line2?: string
  city?: string
  state?: string
  district?: string
  zip_code?: string
  latitude?: string
  longitude?: string
  reference?: string
  courier?: string
  tracking_url?: string
}

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  product_image?: string
  quantity: number
  price: number
  subtotal: number
  product?: {
    id: number
    sku: string
    images?: Array<{ url: string }>
  }
}

export interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  document_type?: string
  document_number?: string
  created_at: string
}

export interface Address {
  street: string
  city: string
  state: string
  zip_code: string
  country: string
  reference?: string
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderFilters {
  search: string
  status: OrderStatus | null
  dateFrom: string | null
  dateTo: string | null
}

export interface OrdersState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  filters: OrderFilters
}
