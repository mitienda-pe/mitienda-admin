// Tipos de productos
import type { ProductVideo } from './product-video.types'
import type { ProductDocument } from './product-document.types'

export interface ProductSEO {
  meta_title?: string
  meta_description?: string
  meta_image?: string | null
  slug?: string
}

export interface ProductExternalCategory {
  id: string
  name: string
}

export interface ProductExternalCategories {
  facebook?: ProductExternalCategory | null
  google?: ProductExternalCategory | null
  mercadolibre?: ProductExternalCategory | null
}

export interface PriceRange {
  min: number | null
  max: number | null
  has_range: boolean
}

export interface Product {
  id: number
  sku: string
  barcode?: string
  name: string
  description?: string
  description_html?: string
  price: number
  price_without_tax?: number // Precio sin IGV (8 decimales de precisión)
  price_range?: PriceRange | null // Rango de precios para productos con variantes
  has_variation_attributes?: boolean // Indica si el producto tiene variantes
  compare_price?: number
  cost?: number
  stock: number
  unlimited_stock: boolean
  min_stock?: number
  weight?: number
  weight_unit?: string
  height?: number
  width?: number
  length?: number
  dimensions_unit?: string
  volumetric_weight?: number
  published: boolean
  featured: boolean
  images: ProductImage[]
  video?: ProductVideo | null
  documents?: ProductDocument[]
  categories?: Category[]
  brand?: Brand
  gamma?: Gamma
  seo?: ProductSEO
  external_categories?: ProductExternalCategories
  order?: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: number
  url: string
  cloudflare_url?: string
  cloudflare_id?: string
  cloudflare_imagen_id?: number  // NEW: ID from cloudflare_images table
  thumbnail?: string
  position: number
  is_main: boolean
  source?: 'cloudflare' | 'legacy'  // NEW: Track image source
}

export interface Category {
  id: number
  name: string
  slug: string
  parent_id?: number
  image?: string
  image_id?: number
  order?: number
  meta_title?: string
  meta_description?: string
  sub?: Category[] // Subcategorías anidadas
}

export interface CategoryFormData {
  name: string
  slug?: string
  parent_id?: number | null
  image?: string
  order?: number
  meta_title?: string
  meta_description?: string
}

export interface Brand {
  id: number
  name: string
  slug: string
  logo?: string
  image_id?: number
  meta_title?: string
  meta_description?: string
}

export interface BrandFormData {
  name: string
  slug?: string
  image?: string
  meta_title?: string
  meta_description?: string
}

export interface Gamma {
  id: number
  name: string
}

export interface ProductFilters {
  search: string
  categoryId: number | null
  brandId: number | null
  published: boolean | null
  stockStatus: 'all' | 'in_stock' | 'limited' | 'out_of_stock'
}

export interface ProductsState {
  products: Product[]
  currentProduct: Product | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  filters: ProductFilters
}
