/**
 * Tipos del generador de catálogos PDF.
 *
 * Flujo asíncrono: se crea una solicitud (createCatalog), el backend encola la
 * generación y el frontend hace polling (getCatalog) hasta `done`/`failed`.
 */

export type CatalogScope = 'all' | 'category' | 'brand' | 'list'
export type CatalogPerPage = 2 | 3 | 4 | 9
export type CatalogCoverType = 'none' | 'auto' | 'uploaded'
export type CatalogStatus = 'queued' | 'processing' | 'done' | 'failed'

export interface CatalogFilters {
  category_id?: number
  brand_id?: number
  list_id?: number
}

export interface Catalog {
  id: number
  name: string
  scope: CatalogScope
  filters: CatalogFilters
  per_page: CatalogPerPage
  cover_type: CatalogCoverType
  show_description: boolean
  show_promotions: boolean
  show_promo_expiry: boolean
  include_out_of_stock: boolean
  status: CatalogStatus
  r2_url: string | null
  product_count: number | null
  error: string | null
  created_at: string | null
}

/** Conteo de productos que entran en un alcance (pre-vuelo del formulario). */
export interface CatalogScopeCount {
  matched_count: number
  included_count: number
  max_products: number
  truncated: boolean
}

export interface CreateCatalogPayload {
  nombre: string
  scope: CatalogScope
  per_page: CatalogPerPage
  cover_type: CatalogCoverType
  show_description: boolean
  /** Imprimir precios con promoción. Apagado, el catálogo va a precio de lista. */
  show_promotions: boolean
  /** Imprimir el "Precio válido hasta el ...". Solo aplica con `show_promotions`. */
  show_promo_expiry: boolean
  /** Incluir productos agotados. Por defecto el catálogo solo trae lo que hay en stock. */
  include_out_of_stock: boolean
  cover_url?: string
  category_id?: number
  brand_id?: number
  list_id?: number
}

export const CATALOG_MAX_PRODUCTS = 100
