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

export interface ProductSalesReportRow {
  order_id: number
  order_code: string
  order_date: string
  customer_name: string
  customer_email: string
  customer_document: string
  customer_phone: string
  customer_address: string
  product_id: number
  product_code: string
  product_name: string
  product_quantity: number
  product_unit_price: number
  product_subtotal: number
  product_discount: number
  product_total: number
  promotion_name: string | null
  promotion_type: string | null
  payment_status: string
  payment_method: string
  total: number
  currency: string
  shipping_status: string
  shipping_address: string
  shipping_department: string
  shipping_province: string
  shipping_district: string
  shipping_cost: number
  delivery_date: string | null
  tracking_code: string | null
}

export interface ProductSalesPreviewResponse {
  data: ProductSalesReportRow[]
  total_count: number
  has_more: boolean
  filters_applied: ReportFilters
}

// Product Catalog Report
export interface ProductCatalogFilters {
  search?: string
  published?: string // '0' | '1' | '' (all)
  stock_status?: string // 'all' | 'in_stock' | 'out_of_stock' | 'limited'
  category_id?: number
  brand_id?: number
}

export interface ProductCatalogRow {
  product_id: number
  sku: string
  name: string
  stock: number | string // number or "Ilimitado"
  stock_raw: number
  stock_unlimited: boolean
  price_without_tax: number
  price_with_tax: number
  published: boolean
  published_label: string
  category: string
  brand: string
}

export interface ProductCatalogPreviewResponse {
  data: ProductCatalogRow[]
  total_count: number
  has_more: boolean
  filters_applied: ProductCatalogFilters
}
