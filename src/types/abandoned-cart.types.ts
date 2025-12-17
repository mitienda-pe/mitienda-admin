export interface AbandonedCart {
  id: number
  email: string
  customer_name: string
  customer_type: 'registered' | 'guest'
  amount: string
  currency: 'PEN' | 'USD'
  qty_items: number
  status: 0 | 1 | 2  // 0 = abandonado, 1 = recuperado, 2 = pendiente
  status_label: string
  recovery_channel: number | null
  created_at: string
  updated_at: string
  url_redirect: string
  has_order: boolean
}

export interface AbandonedCartDetail {
  id: number
  email: string
  customer: {
    name: string
    surname: string
    business_name: string
    document_number: string
    phone: string
    customer_id: number | null
    is_guest: boolean
  }
  created_at: string
  updated_at: string
  qty_items: number
  currency: 'PEN' | 'USD'
  status: 0 | 1 | 2
  status_label: string
  recovery_channel: number | null
  url_redirect: string
  order: {
    id: number
    reference_code: string
    payment_date: string | null
  } | null
  items: AbandonedCartItem[]
  total_amount: string
}

export interface AbandonedCartItem {
  id: number
  sku: string
  qty: number
  name: string
  description: string
  image: string
  price: string
  subtotal: string
  variation_attributes: {
    id: string
    name: string
  } | null
  discount: string
  promotion_end_date: string | null
}

export type CartStatus = 'all' | '0' | '1' | '2'
export type CustomerType = 'all' | '1' | '2'  // all, registered, guest
export type RecoveryChannel = 'all' | '1' | '2'  // all, organic, doppler
export type CartSortBy = 'id' | 'email' | 'customer' | 'amount' | 'date' | 'status'
export type SortOrder = 'asc' | 'desc'

export interface AbandonedCartsFilters {
  from?: string
  to?: string
  customer_type?: CustomerType
  status?: CartStatus
  channel?: RecoveryChannel
  search?: string
  page?: number
  per_page?: number
  sort_by?: CartSortBy
  sort_order?: SortOrder
}
