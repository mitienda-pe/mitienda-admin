// Report Types and Interfaces

export enum PaymentStatus {
  ALL = -1,
  APPROVED = 1,
  PENDING = 2,
  REJECTED = 0,
  EXPIRED = 12
}

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf'
}

export interface ReportFilters {
  date_from?: string // ISO format YYYY-MM-DD
  date_to?: string
  payment_status?: PaymentStatus
  payment_gateway_id?: number // 0 = All
}

export interface OrderReportRow {
  order_id: number
  order_code: string
  order_date: string
  customer_name: string
  customer_email: string
  customer_document: string
  payment_status: string
  payment_date: string | null
  total: number
  currency: string
  shipping_status: string
  payment_method: string
}

export interface ReportPreviewResponse {
  data: OrderReportRow[]
  total_count: number
  has_more: boolean
  filters_applied: ReportFilters
}

export interface PaymentGateway {
  id: number
  name: string
}
