export interface ReferralCode {
  tiendacodigoreferido_id: number
  tienda_id: number
  tiendacodigoreferido_nombre: string
  tiendacodigoreferido_codigo: string
  tiendacodigoreferido_activo: number
  tiendacodigoreferido_estado: number
  tiendacodigoreferido_fechacreacion: string
  tiendacodigoreferido_fechaeliminacion: string | null
}

export interface ReferralCodeCreateRequest {
  tiendacodigoreferido_nombre: string
  tiendacodigoreferido_codigo: string
  tiendacodigoreferido_activo?: number
}

export interface ReferralCodeUpdateRequest {
  tiendacodigoreferido_nombre?: string
  tiendacodigoreferido_activo?: number
}

export interface ReferralCodeListResponse {
  error: number
  data: ReferralCode[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface ReferralCodeResponse {
  error: number
  data: ReferralCode
  message?: string
}

export interface GenerateCodeResponse {
  error: number
  data: {
    code: string
  }
}
