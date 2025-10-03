// Tipos de dashboard
import type { Order } from './order.types'

export type DashboardPeriod = 'today' | 'week' | 'month'

export interface MetricChange {
  value: number
  percentage: number
  isPositive: boolean
}

export interface SalesMetric {
  amount: number
  orders_count: number
  change: MetricChange
}

export interface AverageTicketMetric {
  amount: number
  change: MetricChange
}

export interface ProductsMetric {
  published: number
  total: number
  percentage: number
}

export interface StockMetric {
  out_of_stock: number
  total_published: number
  percentage: number
}

export interface DashboardMetrics {
  sales: SalesMetric
  average_ticket: AverageTicketMetric
  products: ProductsMetric
  stock: StockMetric
  recent_orders: Order[]
}

export interface DashboardState {
  metrics: DashboardMetrics | null
  period: DashboardPeriod
  isLoading: boolean
  error: string | null
}
