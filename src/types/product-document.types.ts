// Product Document Types

export interface ProductDocument {
  id: number
  name: string
  filename: string
  url: string | null
  size_bytes: number
  size_formatted: string
  mime_type: string
  order: number
  created_at: string | null
}

export interface DocumentUploadResponse {
  success: boolean
  message: string
  data?: {
    documento_id: number
    nombre: string
    orden: number
  }
}

export interface DocumentDeleteResponse {
  success: boolean
  message: string
}

export interface DocumentListResponse {
  success: boolean
  data: ProductDocument[]
}
