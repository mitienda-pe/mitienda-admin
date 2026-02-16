export interface Gamma {
  tiendagamma_id: number
  tienda_id: number
  tiendamarca_id: number
  tiendagamma_nombre: string
  square_r2_url?: string
  cover_r2_url?: string
  og_r2_url?: string
  tiendagamma_descripcion?: string
  tiendagamma_swpublicado: number
  tiendagamma_orden: number
  tiendagamma_fechacreacion?: string
  tiendagamma_fechamodificacion?: string
  // Joined data from query
  marca_nombre?: string
}

export interface GammaFormData {
  tiendamarca_id: number | null
  tiendagamma_nombre: string
  tiendagamma_descripcion: string
  tiendagamma_swpublicado: number
  tiendagamma_orden: number
}

export interface GammaCreateRequest {
  tiendamarca_id: number
  tiendagamma_nombre: string
  tiendagamma_descripcion?: string
  tiendagamma_swpublicado?: number
  tiendagamma_orden?: number
}

export interface GammaUpdateRequest {
  tiendamarca_id?: number
  tiendagamma_nombre?: string
  tiendagamma_descripcion?: string
  tiendagamma_swpublicado?: number
  tiendagamma_orden?: number
}
