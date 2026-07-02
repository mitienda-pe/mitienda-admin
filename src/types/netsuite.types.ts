// NetSuite Credentials Types

export interface NetsuiteLocation {
  id?: number // Same as tiendadireccion_id for backward compatibility
  tiendadireccion_id: number
  tienda_id: number
  netsuite_location_id: string | null
  netsuite_location_name: string
  branch_name: string
  branch_address: string
  is_default: boolean // Deprecated - kept for backward compatibility
}

export interface NetsuiteCredential {
  tiendacredencialerp_id: number
  tienda_id: number
  tiendacredencialerp_account_id: string
  tiendacredencialerp_consumer_key: string
  tiendacredencialerp_consumer_secret_masked: string
  tiendacredencialerp_token_id: string
  tiendacredencialerp_token_secret_masked: string
  tiendacredencialerp_subsidiary_id?: string
  tiendacredencialerp_location_id?: string
  tiendacredencialerp_ubicacion_serie_id?: string
  tiendacredencialerp_generic_customer_id?: string
  tiendacredencialerp_bonification_item_id?: string
  tiendacredencialerp_price_level_id?: number
  tiendacredencialerp_customer_category_id?: string
  // Required NetSuite IDs that used to be hardcoded in PHP code.
  tiendacredencialerp_department_id?: string
  tiendacredencialerp_class_id?: string
  tiendacredencialerp_currency_id?: string
  tiendacredencialerp_country_id?: string
  tiendacredencialerp_terms_id?: string
  tiendacredencialerp_tax_item_id?: string
  tiendacredencialerp_edoc_standard_id?: string
  tiendacredencialerp_receivables_account_id?: string
  tiendacredencialerp_entity_status_id?: string
  tiendacredencialerp_payment_method_id?: string
  tiendacredencialerp_default_zip_id?: string
  tiendacredencialerp_discount_item_id?: string
  // Optional default sales rep when the cajero has no NetSuite ID mapped.
  tiendacredencialerp_default_salesrep_id?: string
  tiendacredencialerp_estado: number
  tiendacredencialerp_autosync_enabled: number
  tiendacredencialerp_delegate_billing?: number
  // Modo de sincronización: 'invoice_direct' (POS) | 'sales_order' (web con guía de remisión)
  tiendacredencialerp_sync_mode?: string
  // Custom Form ID del Sales Order en NetSuite (solo modo sales_order). null = form por defecto de la cuenta.
  tiendacredencialerp_so_custom_form_id?: string | null
  tiendacredencialerp_fecha_creacion?: string
  tiendacredencialerp_fecha_actualizacion?: string
  locations?: NetsuiteLocation[]
  stock_validation_enabled?: boolean
}

export interface SaveNetsuiteCredentialsRequest {
  tienda_id: number
  account_id: string
  consumer_key: string
  consumer_secret?: string
  token_id: string
  token_secret?: string
  subsidiary_id?: string
  location_id?: string
  ubicacion_serie_id?: string
  generic_customer_id?: string
  bonification_item_id?: string
  price_level_id?: number
  customer_category_id?: string
  department_id?: string
  class_id?: string
  currency_id?: string
  country_id?: string
  terms_id?: string
  tax_item_id?: string
  edoc_standard_id?: string
  receivables_account_id?: string
  entity_status_id?: string
  payment_method_id?: string
  default_zip_id?: string
  discount_item_id?: string
  default_salesrep_id?: string
  autosync_enabled: boolean
  delegate_billing?: boolean
  sync_mode?: string
  so_custom_form_id?: string | null
  estado: number
  locations?: NetsuiteLocation[]
}

/**
 * Response payload of /api/v1/netsuite-config/validate.
 */
export type NetsuiteConfigSeverity = 'critical' | 'warning'

export interface NetsuiteConfigIssue {
  category: 'credentials' | 'branches' | 'series' | 'cashier_accounts' | 'employees'
  code: string
  severity: NetsuiteConfigSeverity
  message: string
  field?: string
  tiendadireccion_id?: number
  payment_method?: string
  empleado_id?: number
  tipo?: string
}

export interface NetsuiteConfigValidationResponse {
  tienda_id: number
  /** No issues at all (alias kept for backwards compat). */
  is_complete: boolean
  /** True when there are no critical issues. */
  is_operative: boolean
  has_critical: boolean
  has_warning: boolean
  issue_count: number
  critical_count: number
  warning_count: number
  by_category: Partial<Record<NetsuiteConfigIssue['category'], NetsuiteConfigIssue[]>>
  issues: NetsuiteConfigIssue[]
}

export interface TestNetsuiteConnectionResponse {
  connected: boolean
  account_id: string
  message?: string
}

// NetSuite Series Types

export interface NetsuiteSerie {
  tiendaserieerp_id?: number
  tienda_id: number
  empfacturacionserie_id?: number
  tiendaserieerp_codigo: string
  tiendaserieerp_tipo_documento: string
  tiendaserieerp_netsuite_id: string | null
  tiendaserieerp_netsuite_doctype_id: string
  tiendaserieerp_estado: number
  tiendaserieerp_fecha_creacion?: string
  tiendaserieerp_fecha_actualizacion?: string
}

export interface SaveNetsuiteSerieRequest {
  codigo: string
  tipo_documento: string
  netsuite_id: string | null
  netsuite_doctype_id: string
  empfacturacionserie_id?: number
  estado?: number
}

// NetSuite Inventory Mapping Types

export interface NetsuiteInventoryNumber {
  id?: number
  item_id: number
  lot_number: string
  inventory_number_id: number
  location_id: number
  quantity_available?: number
  created_at?: string
  updated_at?: string
}

export interface ProductInventoryMapping {
  tiendaproducto_id: number
  tiendaproducto_sku: string
  tiendaproducto_titulo: string
  tiendaproducto_estado: number
  tiendaproducto_imagen?: string
  netsuite_item_id: string | null
  inventory_numbers: NetsuiteInventoryNumber[]
  has_mapping: boolean
}

export interface ProductInventoryListResponse {
  products: ProductInventoryMapping[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface SaveProductInventoryRequest {
  tienda_id: number
  producto_id: number
  netsuite_item_id: string
}

export interface SaveInventoryNumberRequest {
  item_id: number
  lot_number: string
  inventory_number_id: number
  location_id: number
  quantity_available?: number
}

export interface ProductInventoryFilters {
  search?: string
  has_mapping?: boolean | null
  page?: number
  limit?: number
}

export interface CsvUploadError {
  sku?: string
  lot_number?: string
  error: string
}

export interface CsvUploadResponse {
  total_rows: number
  products_updated: number
  products_not_found: number
  inventory_numbers_created: number
  errors: CsvUploadError[]
}
