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
}

export type StoreAddressUpdateRequest = Partial<StoreAddressCreateRequest>

export interface Rubro {
  rubro_id: number
  rubro_nombre: string
}
