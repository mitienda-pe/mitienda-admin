// Tipos de dashboard
import type { Order } from './order.types'

// ── Legacy types (kept for backward compat with old endpoint) ──

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

// ── Analytics types (new endpoint) ──

export interface DashboardFilters {
  dateFrom: string // YYYY-MM-DD
  dateTo: string // YYYY-MM-DD
  compare: boolean
}

export interface Scorecard {
  value: number
  previous?: number
}

export interface Scorecards {
  orders_count: Scorecard
  gross_sales: Scorecard
  igv: Scorecard
  net_sales: Scorecard
  avg_ticket: Scorecard
  max_ticket: Scorecard
  min_ticket: Scorecard
  new_customers: Scorecard
  returning_customers: Scorecard
  returning_pct: Scorecard
  cancellation_rate: Scorecard
  avg_items_per_order: Scorecard
  orders_with_discount_pct: Scorecard
}

export interface TrendPoint {
  date?: string
  month?: string
  gross: number
  net: number
  orders: number
}

export interface DistributionItem {
  id?: number
  name: string
  count: number
  amount: number
}

export interface DayDistribution {
  day: string
  day_number: number
  count: number
  amount: number
}

export interface HourDistribution {
  hour: number
  count: number
  amount: number
}

export interface Distributions {
  payment_methods: DistributionItem[]
  shipping_types: DistributionItem[]
  document_types: DistributionItem[]
  by_day_of_week: DayDistribution[]
  by_hour: HourDistribution[]
  new_vs_returning: { new: number; returning: number }
}

export interface TopProduct {
  id: number
  name: string
  sku: string
  units: number
  net_sales: number
  pct_of_total: number
  stock: number
}

export interface TopCustomer {
  id: number
  name: string
  orders_count: number
  net_total: number
  avg_ticket: number
  last_order: string
}

export interface DashboardAnalytics {
  period: { from: string; to: string }
  previous_period: { from: string; to: string }
  scorecards: Scorecards
  trends: {
    daily_sales: TrendPoint[]
    monthly_sales: TrendPoint[]
  }
  distributions: Distributions
  top_products: TopProduct[]
  top_customers: TopCustomer[]
}
