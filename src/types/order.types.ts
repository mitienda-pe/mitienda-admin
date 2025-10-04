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
  status: OrderStatus
  payment_method: string
  payment_status: string
  payment_gateway?: string
  gateway_code?: string
  gateway_message?: string
  shipping_address?: Address | string
  shipping_details?: ShippingDetails
  billing_address?: Address
  notes?: string
  created_at: string
  updated_at: string
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
