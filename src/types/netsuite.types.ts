// NetSuite Credentials Types

export interface NetsuiteLocation {
  id?: number
  location_id: string
  location_name: string
  is_default: boolean
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
  tiendacredencialerp_location_id?: string // Deprecated - for backward compatibility
  tiendacredencialerp_ubicacion_serie_id?: string
  tiendacredencialerp_estado: number
  tiendacredencialerp_autosync_enabled: number
  tiendacredencialerp_fecha_creacion?: string
  tiendacredencialerp_fecha_actualizacion?: string
  locations?: NetsuiteLocation[] // New field for multiple locations
}

export interface SaveNetsuiteCredentialsRequest {
  tienda_id: number
  account_id: string
  consumer_key: string
  consumer_secret?: string
  token_id: string
  token_secret?: string
  subsidiary_id?: string
  location_id?: string // Deprecated - for backward compatibility
  ubicacion_serie_id?: string
  autosync_enabled: boolean
  estado: number
  locations?: NetsuiteLocation[] // New field for multiple locations
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
