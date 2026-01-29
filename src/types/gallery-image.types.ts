export type ImageSource = 'legacy' | 'cloudflare'

export interface GalleryImage {
  id: number
  source: ImageSource
  title: string | null
  alt_text: string | null
  description: string | null
  thumbnail_url: string | null
  uploaded_at: string
  width: number | null
  height: number | null
  file_size: number | null
}

export interface ImageVariant {
  name: string
  url: string
  width: number | null
  height: number | null
}

export interface GalleryImageDetail extends GalleryImage {
  preview_url: string | null
  variants: ImageVariant[]
  used_by_products: { id: number; name: string }[]
}

export interface GalleryPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface GalleryFilters {
  search: string
  source: 'all' | ImageSource
}

export interface ImageMetadataUpdate {
  title?: string
  alt_text?: string
  description?: string
}
