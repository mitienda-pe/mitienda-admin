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

// Tipo de producto (físico / servicio / digital). Tabla maestra `productostipos`.
// Las flags de capacidad rigen el comportamiento (envío, dirección, canje).
export interface ProductType {
  id: number
  code: 'physical' | 'service' | 'digital' | string
  name: string
  requires_shipping: boolean
  requires_address: boolean
  is_redeemable: boolean
  is_digital: boolean
  publico: boolean
  orden?: number
  activo?: boolean
}

/**
 * Promoción activa que el listado de productos aplica sobre el precio.
 * La API la resuelve tanto de promotions_v2 como de las promos legacy
 * (`GET /products` → Product::getProductPromotionsBatch); `price` ya viene con
 * el descuento aplicado y `original_price` trae el precio de lista.
 * `id` puede ser string (`"v2_123"`) cuando la promo viene del motor V2.
 */
export interface ProductPromotion {
  id: number | string
  name: string
  type: 'percentage' | 'fixed'
  /** Texto listo para mostrar (ej. "-20%"). Preferir `percentage`/`amount` al formatear. */
  value: string
  percentage?: number
  /** Monto descontado en la moneda de la tienda. */
  amount?: number
}

export interface Product {
  id: number
  sku: string
  barcode?: string
  name: string
  // Tipo de producto. `product_type_id` es el discriminador (1=físico, 2=servicio,
  // 3=digital); `product_type` trae las flags de capacidad cuando la API las incluye.
  product_type_id?: number
  product_type?: ProductType | null
  description?: string
  description_html?: string
  description_short?: string
  price: number
  price_without_tax?: number // Precio sin IGV (8 decimales de precisión)
  price_range?: PriceRange | null // Rango de precios para productos con variantes
  has_variation_attributes?: boolean // Indica si el producto tiene variantes
  /** Precio de lista cuando hay promoción activa: `price` ya viene descontado. */
  original_price?: number
  promotion?: ProductPromotion | null
  compare_price?: number
  cost?: number
  stock: number
  unlimited_stock: boolean
  /** Tope de unidades por compra (0 = sin tope). Solo se aplica si la tienda
   *  tiene encendido el límite de compra por producto. */
  max_purchase_qty?: number
  min_stock?: number
  // Control por lotes con vencimiento (perecibles)
  lots_managed?: boolean
  producto_sw_lotes?: number
  // Venta al peso: la cantidad vendida es el peso (kg) y el precio es por unidad de peso
  sold_by_weight?: boolean
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
  /**
   * Bolsa plástica afecta a ICBPER (Ley N.° 30884): tributo de monto FIJO por
   * bolsa (S/ 0.50), cobrado encima del IGV y fuera de su base imponible. El
   * monto es constante de plataforma; aquí solo viaja el flag.
   */
  icbper?: boolean
  published: boolean
  /** Visibilidad en el catálogo del POS. Independiente de `published` (storefront). */
  published_pos?: boolean
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
  cloudflare_imagen_id?: number
  r2_imagen_id?: number
  r2_url?: string
  thumbnail?: string
  position: number
  is_main: boolean
  source?: 'cloudflare' | 'legacy' | 'r2'
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

/**
 * Lo que se perdería al borrar una categoría. `products_orphaned` es el dato
 * que importa: productos que se quedarían sin ninguna categoría — siguen en el
 * buscador y en el listado general, pero ya no se llega a ellos navegando.
 */
export interface CategoryDeleteImpact {
  category: { id: number; name: string }
  subcategories: Array<{ id: number; name: string }>
  products_affected: number
  products_orphaned: number
  /** Categoría padre propuesta como destino. null si es una categoría raíz. */
  reassign_target: { id: number; name: string } | null
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
  productTypeId: number | null
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
  icbper?: boolean // Bolsa plástica afecta a ICBPER (Ley 30884)
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
  tax_affectation?: number // 1=Gravado, 2=Exonerado, 3=Inafecto
  variants?: { id: number; price?: number; price_without_tax?: number }[]
}

export interface BatchStockUpdate {
  id: number
  stock?: number
  unlimited_stock?: boolean
  variants?: { id: number; stock?: number; unlimited_stock?: boolean }[]
}

// ─── Lotes con vencimiento (perecibles) ──────────────────────────
export interface ProductLot {
  lote_id: number
  productoatributo_id: number
  codigo: string | null
  fecha_ingreso: string | null
  fecha_produccion: string | null
  fecha_vencimiento: string | null
  cantidad_inicial: number
  cantidad: number
  costo: number | null
  estado: number // 1 activo, 0 agotado, 2 baja
  origen: string
  vencido: boolean
}

export interface ProductLotCreate {
  productoatributo_id?: number
  cantidad: number
  fecha_vencimiento?: string | null
  fecha_produccion?: string | null
  codigo?: string | null
  costo?: number | null
}

export interface ProductLotMovement {
  id: number
  lote_id: number
  productoatributo_id: number
  tipo: 'ingreso' | 'salida' | 'merma' | 'ajuste' | 'devolucion'
  cantidad: number
  cantidad_resultante: number
  referencia: string | null
  tiendaventa_id: number | null
  fecha: string
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
  current_affectation?: number // 1=Gravado, 2=Exonerado, 3=Inafecto
  new_affectation?: number | null
}

// ── Product creation ──

export interface ProductCreatePayload {
  name: string
  product_type_id?: number
  sku?: string
  barcode?: string
  price?: number
  price_without_tax?: number
  cost?: number | null
  stock?: number
  unlimited_stock?: boolean
  max_purchase_qty?: number
  description?: string
  description_short?: string
  brand_id?: number | null
  gamma_id?: number | null
  categories?: number[]
  published?: boolean
  /** Visibilidad en el catálogo del POS. Independiente de `published` (storefront). */
  published_pos?: boolean
  featured?: boolean
  order?: number
  igv_percent?: number
  tax_affectation?: number
  icbper?: boolean // Bolsa plástica afecta a ICBPER (Ley 30884)
  // SEO
  meta_title?: string
  meta_description?: string
  meta_image?: string | null
  slug?: string
  // Venta al peso: la cantidad vendida es el peso (kg) y el precio es por unidad de peso
  sold_by_weight?: boolean
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

// '1' = solo publicados, '0' = solo no publicados, '' = todos (sin filtro).
// Se usa cadena vacía en vez de undefined para que el Dropdown pueda enlazar
// la opción "Todos"; los helpers que arman la query la descartan por falsy.
export type PublishedFilter = '' | '1' | '0'

export interface ProductManagementFilters {
  page?: number
  limit?: number
  search?: string
  published?: PublishedFilter
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
  barcode?: string | null
  names: string
  price: number
  cost?: number | null
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
    barcode?: string | null
    price: number
    cost?: number | null
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

// ── Precios por mayor (descuentos por volumen) ──

/**
 * Un tramo: a partir de `quantity` unidades el precio unitario pasa a ser
 * `price`. No es un porcentaje — es el precio final por unidad.
 *
 * `variant_id` en null significa que el tramo aplica a nivel producto. Los
 * tramos de una variante son un override: si la variante tiene los suyos, los
 * del producto no corren para esa variante.
 */
export interface WholesalePriceTier {
  id?: number
  variant_id: number | null
  quantity: number
  price: number
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
