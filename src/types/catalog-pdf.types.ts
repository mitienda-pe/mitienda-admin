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
  status: CatalogStatus
  r2_url: string | null
  product_count: number | null
  error: string | null
  created_at: string | null
}

export interface CreateCatalogPayload {
  nombre: string
  scope: CatalogScope
  per_page: CatalogPerPage
  cover_type: CatalogCoverType
  show_description: boolean
  cover_url?: string
  category_id?: number
  brand_id?: number
  list_id?: number
}

export const CATALOG_MAX_PRODUCTS = 100
