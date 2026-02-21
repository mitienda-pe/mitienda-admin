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

export interface ExternalCategoryOption {
  id: number
  external_id: string
  name: string
  has_children: boolean
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
  description_short?: string
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
  shipping_conversion_factor?: number
  shipping_per_unit?: boolean
  igv_percent?: number
  tax_affectation?: number // 1=Gravado, 2=Exonerado, 3=Inafecto
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
  square_r2_url?: string
  cover_r2_url?: string
  og_r2_url?: string
  order?: number
  meta_title?: string
  meta_description?: string
  product_count?: number // Cantidad de productos en esta categoría
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
  square_r2_url?: string
  cover_r2_url?: string
  og_r2_url?: string
  meta_title?: string
  meta_description?: string
  product_count?: number // Cantidad de productos con esta marca
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

// ── Product Management Views (lightweight items) ──

export interface ProductPriceItem {
  id: number
  sku: string
  name: string
  image: string | null
  price: number
  price_without_tax: number | null
  igv_percent: number
  tax_affectation: number // 1=Gravado, 2=Exonerado, 3=Inafecto
  published: boolean
  has_variants: boolean
  variants: VariantPriceItem[]
}

export interface VariantPriceItem {
  id: number
  sku: string
  name: string
  price: number
  price_without_tax: number | null
}

export interface ProductStockItem {
  id: number
  sku: string
  name: string
  image: string | null
  stock: number
  unlimited_stock: boolean
  published: boolean
  has_variants: boolean
  variants: VariantStockItem[]
}

export interface VariantStockItem {
  id: number
  sku: string
  name: string
  stock: number
  unlimited_stock: boolean
}

export interface ProductOrderItem {
  id: number
  sku: string
  name: string
  image: string | null
  order: number
  published: boolean
  categories: string[]
}

// ── Batch update payloads ──

export interface BatchPriceUpdate {
  id: number
  price?: number
  price_without_tax?: number
  variants?: { id: number; price?: number; price_without_tax?: number }[]
}

export interface BatchStockUpdate {
  id: number
  stock?: number
  unlimited_stock?: boolean
  variants?: { id: number; stock?: number; unlimited_stock?: boolean }[]
}

export interface BatchOrderUpdate {
  id: number
  order: number
}

// ── CSV Import ──

export interface CsvImportPreview {
  preview: CsvPreviewRow[]
  total_rows: number
  errors: { row: number; message: string }[]
}

export interface CsvPreviewRow {
  row_number: number
  sku: string
  name: string
  current_value: number | string
  new_value: number | string
  variant_sku?: string
  variant_name?: string
  has_change: boolean
}

// ── Product creation ──

export interface ProductCreatePayload {
  name: string
  sku?: string
  barcode?: string
  price?: number
  price_without_tax?: number
  stock?: number
  unlimited_stock?: boolean
  description?: string
  description_short?: string
  brand_id?: number | null
  gamma_id?: number | null
  categories?: number[]
  published?: boolean
  order?: number
  igv_percent?: number
  tax_affectation?: number
  // SEO
  meta_title?: string
  meta_description?: string
  meta_image?: string | null
  slug?: string
  // Dimensiones y peso
  height?: number | null
  width?: number | null
  length?: number | null
  dimensions_unit?: string
  weight?: number | null
  weight_unit?: string
  // External categories
  facebook_category_id?: string | null
  google_category_id?: string | null
  // Shipping per product
  shipping_conversion_factor?: number
  shipping_per_unit?: boolean
}

export type ProductUpdatePayload = Partial<ProductCreatePayload> & {
  description_html?: string
}

// ── Management view list filters ──

export interface ProductManagementFilters {
  page?: number
  limit?: number
  search?: string
  sort_field?: string
  sort_order?: 'ASC' | 'DESC'
}

// ── Product Variants (Attribute Combinations) ──

export interface VariantDetail {
  store_attribute_id: number
  store_attribute_name: string
  option_id: number
  option_text: string
  global_attribute_id: number
}

export interface ProductVariant {
  id: number | null
  sku: string
  names: string
  price: number
  offer_price: number | null
  stock: number
  unlimited_stock: boolean
  image_id: number | null
  image_url: string | null
  details: VariantDetail[]
}

export interface ProductAttributeInfo {
  id: number
  name: string
  slug: string
  type: number
  style: number
  order: number
}

export interface VariantsData {
  attributes: ProductAttributeInfo[]
  variants: ProductVariant[]
}

export interface GenerateVariantsPayload {
  attributes: {
    store_attribute_id: number
    option_ids: number[]
  }[]
}

export interface SaveVariantsPayload {
  variants: {
    id: number | null
    sku: string
    price: number
    offer_price: number | null
    stock: number
    unlimited_stock: boolean
    image_id: number | null
    details: {
      store_attribute_id: number
      option_id: number
      global_attribute_id: number
    }[]
  }[]
  deleted_ids: number[]
}

// ── Bulk CSV Import ──

export interface BulkCsvParsedRow {
  rowNumber: number
  raw: Record<string, string>
  mapped: Record<string, any>
  errors: string[]
  warnings: string[]
  isValid: boolean
}

export interface BulkProcessingResult {
  rowNumber: number
  sku: string
  productName: string
  success: boolean
  action: 'created' | 'updated' | 'skipped'
  productId?: number
  error?: string
}

export interface BulkImportSummary {
  total: number
  created: number
  updated: number
  errors: number
  skipped: number
}
