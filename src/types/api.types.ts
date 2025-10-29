// Tipos generales de API
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginationMeta {
  page: number
  limit?: number
  perPage?: number  // Backend devuelve perPage en lugar de limit
  total: number
  totalPages: number
  hasMore: boolean
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
}

export interface ApiError {
  message: string
  code?: string
  errors?: Record<string, string[]>
}
