// Product Video Types

export interface ProductVideo {
  cloudflare_uid: string | null
  stream_url: string | null
  thumbnail_url: string | null
  duration: number | null
  width: number | null
  height: number | null
  aspect_ratio: number | null
  status: VideoStatus | null
  error: string | null
  created_at: string | null
}

export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'error'

export interface VideoUploadResponse {
  success: boolean
  message: string
  data?: {
    product_id: number
    status: VideoStatus
    filename: string
  }
}

export interface VideoDeleteResponse {
  success: boolean
  message: string
}
