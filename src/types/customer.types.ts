// Tipos de clientes
import type { Order } from './order.types'

export interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  document_type?: string
  document_number?: string
  birthdate?: string | null
  created_at: string
  verified: boolean
  blocked: boolean
  total_orders?: number
  total_spent?: number
}

export interface CustomerDetail extends Customer {
  recent_orders?: Order[]
  orders?: Order[]  // Alias para compatibilidad
  stats?: {
    total_orders: number
    total_spent: number
    average_order_value: number
    last_order_date: string | null
  }
}

export interface CustomerFilters {
  search: string
  verified: boolean | null
  blocked: boolean | null
  dateFrom: string | null
  dateTo: string | null
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
  filters: CustomerFilters
}

export interface CustomerStats {
  total: number
  verified: number
  blocked: number
  new_this_month: number
}
