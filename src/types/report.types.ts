// Report Types and Interfaces

// Códigos de `tiendaventa_pagado`. ALL trae todo menos el 9 = Creado (carrito
// abandonado en la pasarela), que el backend excluye por defecto.
export enum PaymentStatus {
  ALL = -1,
  APPROVED = 1,
  PENDING = 2,
  REJECTED = 0,
  VOIDED = 4,
  EXPIRED = 12,
  CHARGEBACK = 13,
  REFUNDED = 14
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

/**
 * Modo del reporte: `detail` es una fila por línea de pedido; `summary` es el
 * ranking agregado por producto que traía el panel legacy.
 */
export type ProductSalesView = 'detail' | 'summary'

export interface ProductSalesReportRow {
  order_id: number
  order_code: string
  order_date: string
  document_type: string
  document_number: string
  origen: string
  branch: string
  cashier: string
  customer_name: string
  /** Nombres y apellidos por separado, como los daba el panel legacy. */
  customer_first_name: string
  customer_last_name: string
  customer_business_name: string
  customer_email: string
  customer_document: string
  customer_phone: string
  customer_address: string
  product_id: number
  /** SKU de lo vendido: el de la variante si la hay, si no el del producto. */
  sku: string
  product_code: string
  variant_sku: string | null
  product_name: string
  product_variant: string | null
  product_quantity: number
  product_unit_price: number
  product_subtotal: number
  product_discount: number
  product_total: number
  product_unit_cost: number
  product_cost_subtotal: number
  product_profit: number
  product_margin_pct: number
  promotion_name: string | null
  promotion_type: string | null
  payment_status: string
  payment_method: string
  payment_detail: string
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

/** Fila del ranking agregado por producto (`view=summary`). */
export interface ProductSalesSummaryRow {
  product_id: number
  sku: string
  product_name: string
  order_count: number
  product_quantity: number
  product_subtotal: number
  product_discount: number
  product_total: number
  product_cost_subtotal: number
  product_profit: number
  product_margin_pct: number
  currency: string
}

export interface ProductSalesPreviewResponse {
  view: ProductSalesView
  data: ProductSalesReportRow[] | ProductSalesSummaryRow[]
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

// Promotions Report
export interface PromotionsFilters {
  search?: string
  estado?: string // 'active' | 'inactive' | 'expired' | 'all'
  tipo_descuento?: string // '1' | '2' | 'all'
  origen?: string // 'netsuite' | 'manual' | 'all'
}

export interface PromotionReportRow {
  promotion_id: number
  name: string
  code: string
  discount_type: string // 'Porcentaje' | 'Monto fijo'
  discount_type_raw: number
  discount_value: number
  start_date: string
  end_date: string | null
  status: string // 'Activa' | 'Inactiva' | 'Expirada'
  status_raw: string // 'active' | 'inactive' | 'expired'
  product_count: number
  origin: string // 'NetSuite' | 'Manual'
}

export interface PromotionsPreviewResponse {
  data: PromotionReportRow[]
  total_count: number
  has_more: boolean
  filters_applied: PromotionsFilters
}

// Payment Rejections Report
export interface PaymentRejectionsFilters {
  date_from?: string
  date_to?: string
  payment_gateway_id?: number
}

export interface PaymentRejectionsSummary {
  total_attempts: number
  approved: number
  rejected: number
  pending: number
  expired: number
  rejection_rate_pct: number
  rejected_amount: number
}

export interface RejectionByGateway {
  gateway_id: number
  gateway_name: string
  attempts: number
  approved: number
  rejected: number
  rejection_rate_pct: number
}

export interface RejectionCountItem {
  reason?: string
  brand?: string
  bank?: string
  total: number
}

export interface RejectionByDay {
  day: string
  approved: number
  rejected: number
}

export interface PaymentRejectionsResponse {
  summary: PaymentRejectionsSummary
  by_gateway: RejectionByGateway[]
  by_reason: RejectionCountItem[]
  by_brand: RejectionCountItem[]
  by_bank: RejectionCountItem[]
  by_day: RejectionByDay[]
}

// Rounding (redondeo POS) Report
export interface RoundingReportFilters {
  date_from?: string
  date_to?: string
}

export interface RoundingSummary {
  cantidad: number
  ganancia_redondeo: number
  perdida_redondeo: number
  neto: number
  total_ventas_registradas: number
  total_efectivo_cobrado: number
}

export interface RoundingByDay {
  fecha: string
  cantidad: number
  ganancia_redondeo: number
  perdida_redondeo: number
  neto: number
}

export interface RoundingReportResponse {
  summary: RoundingSummary
  by_day: RoundingByDay[]
}

// SIRE — Registro de Ventas e Ingresos (SUNAT)
export interface SireReportFilters {
  date_from?: string
  date_to?: string
}

/** Metadatos de columna que manda la API; el orden lo fija el backend. */
export interface SireReportColumn {
  label: string
  key: string
  type?: 'text' | 'number' | 'string'
  width?: number
}

export interface SireReportRow {
  periodo: string
  fecha_emision: string
  tipo_cp: string
  tipo_cp_nombre: string
  serie: string
  numero: string
  cliente_tipo_doc: string
  cliente_num_doc: string
  cliente_nombre: string
  base_gravada: number
  igv: number
  exonerado: number
  inafecto: number
  icbper: number
  importe_total: number
  moneda: string
  estado: string
  pedido: string
  canal: string
  sucursal: string
}

export interface SireReportTotals {
  comprobantes: number
  base_gravada: number
  igv: number
  exonerado: number
  inafecto: number
  icbper: number
  importe_total: number
}

export interface SireReportPreviewResponse {
  columns: SireReportColumn[]
  data: SireReportRow[]
  total_count: number
  has_more: boolean
  totals: SireReportTotals
  filters_applied: SireReportFilters
}
