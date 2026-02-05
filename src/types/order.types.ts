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
  store_notes?: string
  tiendaventa_estado_notif_erp?: number // 0 = success, 1 = error
  tiendaventa_mensaje_notif_erp?: string
  tiendaventa_payload_notif_erp?: string // Request payload sent to NetSuite
  erp_sync?: ErpSync
  billing_document?: BillingDocument
  promotions?: OrderPromotion[] // Applied promotions (2x1, discounts, etc.)
  promotions_discount?: number // Total discount from promotions
  coupon_discount?: number // Total discount from coupon
  coupon_code?: string | null // Coupon code used
  coupon_value?: number // Coupon value (percentage or fixed amount)
  coupon_type?: 'percentage' | 'fixed' // Coupon discount type
  referrer_code?: string | null // Referrer/affiliate code
  created_at: string
  updated_at: string
}

export interface OrderPromotion {
  name: string
  code?: string
  discount_amount: number
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  order_item_id?: number | null // Links promotion to specific order item (null = order-level)
  product_id?: number | null
}

export interface OrderPayment {
  method: string
  method_name: string
  amount: string
  reference?: string | null
  authorization_number?: string | null
  payment_date?: string | null
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

export interface ErpSync {
  status: 'synced' | 'error' | 'not_synced'
  netsuite_invoice_id?: string | null
  netsuite_document_number?: string | null
  error_message?: string | null
}

export interface ShippingDetails {
  cost: string
  address: string
  address_line2?: string
  country?: string
  department?: string
  province?: string
  district?: string
  ubigeo_code?: string
  zip_code?: string
  latitude?: string
  longitude?: string
  reference?: string
  courier?: string
  tracking_url?: string
  recipient_name?: string
  recipient_phone?: string
  date_delivered?: string | null
}

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  product_image?: string
  quantity: number
  price: number
  original_price?: number // Precio original antes de descuento
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
  business_name?: string
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
