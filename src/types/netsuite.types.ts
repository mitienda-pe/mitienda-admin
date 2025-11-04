// NetSuite Credentials Types

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
  tiendacredencialerp_estado: number
  tiendacredencialerp_autosync_enabled: number
  tiendacredencialerp_fecha_creacion?: string
  tiendacredencialerp_fecha_actualizacion?: string
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
  autosync_enabled: boolean
  estado: number
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
