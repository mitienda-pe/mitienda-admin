export interface StoreInfo {
  tienda_nombre_comercial: string
  tienda_razonsocial: string
  tienda_ruc: string
  tienda_descripcion: string
  rubro_id: number | null
  rubro_nombre?: string
  tienda_email: string
  tienda_telefonofijo1: string
  tienda_telefonocelular1: string
  tienda_whatsapp: string
  tienda_url_paginaweb: string
  tienda_url_facebook: string
  tienda_url_instagram: string
  tienda_url_twitter: string
  tienda_url_tiktok: string
  tienda_url_pinterest: string
  tienda_url_youtube: string
  tienda_url_linkedin: string
}

export interface StoreInfoUpdateRequest {
  tienda_nombre_comercial?: string
  tienda_razonsocial?: string
  tienda_ruc?: string
  tienda_descripcion?: string
  rubro_id?: number | null
  tienda_email?: string
  tienda_telefonofijo1?: string
  tienda_telefonocelular1?: string
  tienda_whatsapp?: string
  tienda_url_paginaweb?: string
  tienda_url_facebook?: string
  tienda_url_instagram?: string
  tienda_url_twitter?: string
  tienda_url_tiktok?: string
  tienda_url_pinterest?: string
  tienda_url_youtube?: string
  tienda_url_linkedin?: string
}

export interface StoreAddress {
  tiendadireccion_id: number
  tienda_id: number
  tiendadireccion_nombresucursal: string
  tiendadireccion_direccion: string
  tiendadireccion_interior: string
  tiendadireccion_referencia: string
  tiendadireccion_telefono: string
  tiendadireccion_pais: string
  tiendadireccion_dpto: string
  tiendadireccion_prov: string
  tiendadireccion_dist: string
  tiendadireccion_latitud: string
  tiendadireccion_longitud: string
  tiendadireccion_ubigeo: number | null
  tiendadireccion_swpublicado: number
  tiendadireccion_swalmacen: number
  tiendadireccion_swremitente: number
}

export interface StoreAddressCreateRequest {
  tiendadireccion_nombresucursal: string
  tiendadireccion_direccion: string
  tiendadireccion_interior?: string
  tiendadireccion_referencia?: string
  tiendadireccion_telefono?: string
  tiendadireccion_pais?: string
  tiendadireccion_dpto?: string
  tiendadireccion_prov?: string
  tiendadireccion_dist?: string
  tiendadireccion_latitud?: string
  tiendadireccion_longitud?: string
  tiendadireccion_ubigeo?: number | null
  tiendadireccion_swpublicado?: number
  tiendadireccion_swalmacen?: number
  tiendadireccion_swremitente?: number
}

export type StoreAddressUpdateRequest = Partial<StoreAddressCreateRequest>

export interface Rubro {
  rubro_id: number
  rubro_nombre: string
}

// ── Store Configuration Types ──

export interface StoreConfig {
  tiendageneral_idioma: string
  moneda_id: number
  moneda_nombre: string
  moneda_simbolo: string
  moneda_iso: string
  tiendageneral_paisorigen: number
  tiendageneral_montominimo: number | null
  tiendageneral_montomaximo: number
  sw_tienda_visible: number
  tiendageneral_banner_desactivado_url: string | null
  tiendageneral_texto_desactivado: string | null
  tiendageneral_sw_horarioActivo: number
  tiendageneral_json_horarioActivo: string | null
  sw_logincliente: number
}

export interface StoreConfigUpdate {
  tiendageneral_idioma?: string
  moneda_id?: number
  tiendageneral_paisorigen?: number
  tiendageneral_montominimo?: number | null
  tiendageneral_montomaximo?: number
  sw_tienda_visible?: number
  tiendageneral_sw_horarioActivo?: number
  tiendageneral_json_horarioActivo?: string | null
  sw_logincliente?: number
}

export interface Currency {
  moneda_id: number
  moneda_nombre: string
  moneda_simbolo: string
  moneda_iso: string
}

export interface Country {
  id: number
  name: string
  codPais: number
}

export interface StoreScheduleDay {
  day: string
  active: boolean
  open: string
  close: string
}

// ── Store Messages Types ──

export interface StoreMessages {
  tiendageneral_texto_entregadomicilio: string | null
  tiendageneral_texto_recojoentienda: string | null
  tiendageneral_texto_paginaconfirmacion: string | null
  tiendageneral_texto_desactivado: string | null
}

// Info del remitente para etiquetas de envío
export interface SenderInfo {
  businessName: string // Razón social
  commercialName: string // Nombre comercial
  ruc: string // RUC
  phone: string // Teléfono
  address: string // Dirección completa
  district?: string
  province?: string
  department?: string
}
