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
  tienda_sw_whatsapp_fab: number
  tienda_sw_consulta_whatsapp: number
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
  tienda_sw_whatsapp_fab?: number
  tienda_sw_consulta_whatsapp?: number
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

/**
 * Modos del mapa de ubicación en el checkout del storefront.
 *   oculto      → ni el botón se muestra
 *   opcional    → botón visible, mapa colapsado (comportamiento histórico)
 *   visible     → mapa abierto de entrada, dato opcional
 *   obligatorio → sin coordenadas no se puede confirmar el pedido
 * 'obligatorio' solo se exige en envío a domicilio.
 */
export type CheckoutMapMode = 'oculto' | 'opcional' | 'visible' | 'obligatorio'

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
  // Solo Boleta de Venta: oculta la opción de factura en el checkout
  tiendageneral_sw_solo_boleta: number
  // Bloquear la compra si el DNI/RUC no se puede validar en RENIEC/SUNAT
  tiendageneral_sw_validar_documento: number
  tiendageneral_texto_validacion_documento: string | null
  // Mapa de ubicación en el checkout: oculto|opcional|visible|obligatorio.
  // 'opcional' es el comportamiento histórico y el default de la plataforma.
  tiendageneral_mapa_checkout: CheckoutMapMode
  tiendageneral_sw_verificacion_edad: number
  tiendageneral_edad_minima: number
  tiendageneral_texto_verificacion_edad: string | null
  // Notificaciones de venta: incluir copia al correo de la tienda
  sw_notif_incluir_email_tienda: number
  // Kardex de inventario multi-almacén (opt-in, módulo mod_stock_sucursal)
  tiendageneral_sw_inventario: number
  // Control de inventario por lotes con vencimiento (opt-in, Large/PDV)
  tiendageneral_sw_lotes: number
  tiendageneral_lote_estrategia: string | null
  // Límite de compra por producto: habilita el campo "cantidad máxima de compra"
  // en la ficha de cada producto. Apagado, los topes guardados no se aplican.
  sw_limitarproducto: number
  // Solo lectura: add-on de visor 3D/AR. Lo activa MiTienda tras enviar el
  // dominio de la tienda al proveedor (licencia por dominio, no por cuenta).
  // Habilita el botón que inserta el shortcode [ar] en la descripción.
  tiendageneral_sw_ar_3d?: number
  // Derivado (solo lectura): la tienda tiene webhooks legacy configurados.
  // El sidebar muestra "Webhooks (legacy)" solo cuando es true.
  has_legacy_webhooks?: boolean
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
  tiendageneral_sw_solo_boleta?: number
  tiendageneral_sw_validar_documento?: number
  tiendageneral_texto_validacion_documento?: string | null
  tiendageneral_mapa_checkout?: CheckoutMapMode
  tiendageneral_sw_verificacion_edad?: number
  tiendageneral_edad_minima?: number
  tiendageneral_texto_verificacion_edad?: string | null
  sw_notif_incluir_email_tienda?: number
  tiendageneral_sw_inventario?: number
  tiendageneral_sw_lotes?: number
  tiendageneral_lote_estrategia?: string | null
  sw_limitarproducto?: number
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

/**
 * Config del país de la tienda actual, devuelta por GET /store-config/country.
 * Fuente de verdad para labels territoriales, moneda, IVA y decimales.
 */
export interface CountryConfig {
  id: number
  iso2: string
  iso3: string
  nombre: string
  moneda_id: number
  moneda_iso: string | null
  moneda_simbolo: string | null
  iva_rate: number
  ubigeo_root_id: number | null
  decimales: number
  labels: {
    dpto: string
    prov: string
    dist: string
  }
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
