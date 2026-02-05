export interface Combo {
  tiendacombo_id: number
  tienda_id: number
  tiendacombo_nombre: string
  tiendacombo_descripcion: string | null
  tiendacombo_precio: number
  tiendacombo_precioregular: number | null
  tiendacombo_imagen: string | null
  tiendacombo_mostrar_catalogo: number
  tiendacombo_mostrar_carrito: number
  tiendacombo_activo: number
  tiendacombo_estado: number
  tiendacombo_fechacreacion: string
  tiendacombo_fechaactualizacion: string | null
  products?: ComboProduct[]
  savings?: number
  savings_percent?: number
}

export interface ComboProduct {
  tiendacomboproducto_id: number
  tiendacombo_id: number
  producto_id: number
  tiendacomboproducto_cantidad: number
  tiendacomboproducto_orden: number
  producto_nombre?: string
  producto_precio?: number
  producto_imagen?: string
  producto_sku?: string
}

export interface ComboProductInput {
  producto_id: number
  cantidad?: number
}

export interface ComboCreateRequest {
  tiendacombo_nombre: string
  tiendacombo_descripcion?: string
  tiendacombo_precio: number
  tiendacombo_precioregular?: number
  tiendacombo_imagen?: string
  tiendacombo_mostrar_catalogo?: number
  tiendacombo_mostrar_carrito?: number
  tiendacombo_activo?: number
  products?: ComboProductInput[]
}

export interface ComboUpdateRequest {
  tiendacombo_nombre?: string
  tiendacombo_descripcion?: string
  tiendacombo_precio?: number
  tiendacombo_precioregular?: number
  tiendacombo_imagen?: string
  tiendacombo_mostrar_catalogo?: number
  tiendacombo_mostrar_carrito?: number
  tiendacombo_activo?: number
  products?: ComboProductInput[]
}

export interface ComboListResponse {
  error: number
  data: Combo[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface ComboResponse {
  error: number
  data: Combo
  message?: string
}

export interface ComboImageResponse {
  error: number
  data: {
    image: string
  }
  message?: string
}
