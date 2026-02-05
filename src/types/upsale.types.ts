export interface Upsale {
  tiendaupsale_id: number
  tienda_id: number
  tiendaupsale_nombre: string
  tiendaupsale_descripcion: string | null
  tiendaupsale_activo: number
  tiendaupsale_estado: number
  tiendaupsale_fechacreacion: string
  tiendaupsale_fechaactualizacion: string | null
  triggers?: UpsaleTrigger[]
  suggested?: UpsaleSuggested[]
}

export interface UpsaleTrigger {
  tiendaupsaletrigger_id: number
  tiendaupsale_id: number
  producto_id: number
  producto_nombre?: string
  producto_precio?: number
  producto_imagen?: string
}

export interface UpsaleSuggested {
  tiendaupsalesugerido_id: number
  tiendaupsale_id: number
  producto_id: number
  tiendaupsalesugerido_orden: number
  producto_nombre?: string
  producto_precio?: number
  producto_imagen?: string
}

export interface UpsaleCreateRequest {
  tiendaupsale_nombre: string
  tiendaupsale_descripcion?: string
  tiendaupsale_activo?: number
  triggers?: number[]
  suggested?: number[]
}

export interface UpsaleUpdateRequest {
  tiendaupsale_nombre?: string
  tiendaupsale_descripcion?: string
  tiendaupsale_activo?: number
  triggers?: number[]
  suggested?: number[]
}

export interface UpsaleListResponse {
  error: number
  data: Upsale[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface UpsaleResponse {
  error: number
  data: Upsale
  message?: string
}
