// Tipos de clientes
import type { Order } from './order.types'

export interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  document_type?: string
  document_number?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  total_orders?: number
  total_spent?: number
  created_at: string
  updated_at: string
}

export interface CustomerDetail extends Customer {
  orders: Order[]
}

export interface CustomersState {
  customers: Customer[]
  currentCustomer: CustomerDetail | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  filters: {
    search: string
  }
}
