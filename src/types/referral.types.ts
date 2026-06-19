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

// ── CSV Import ──

export type ReferralImportAction = 'crear' | 'duplicado' | 'error'

export interface ReferralImportRow {
  linea: number
  nombre: string
  codigo: string
  accion: ReferralImportAction
  mensaje: string
}

export interface ReferralImportPreview {
  resumen: {
    total: number
    crear: number
    duplicados: number
    errores: number
  }
  filas: ReferralImportRow[]
}

export interface ReferralImportResult {
  creados: number
  omitidos: number
  errores: number
}

// Forma normalizada por el interceptor de axios ({ error,data } → { success,data })
export interface ReferralImportPreviewResponse {
  success: boolean
  message?: string
  data: ReferralImportPreview
}

export interface ReferralImportResultResponse {
  success: boolean
  message?: string
  data: ReferralImportResult
}
