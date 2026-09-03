import apiClient from './axios'
import type { PaginationMeta } from '@/types/api.types'
import type { Catalog, CatalogScopeCount, CreateCatalogPayload } from '@/types/catalog-pdf.types'

/**
 * API de catálogos PDF (generación asíncrona).
 *
 * El interceptor de axios normaliza `{ error: 0, data }` → `{ success, data }` y
 * preserva `pagination`. La descarga del PDF es directa vía `catalog.r2_url`
 * (URL pública de R2), no requiere blob.
 */
export const catalogPdfApi = {
  /**
   * Crea una solicitud de catálogo y devuelve su id (estado inicial `queued`).
   * Si el alcance supera el tope, `truncated` indica que solo entran los primeros
   * `included_count` de `matched_count`.
   */
  async createCatalog(payload: CreateCatalogPayload): Promise<{
    catalog_id: number
    status: string
    matched_count: number
    included_count: number
    truncated: boolean
  }> {
    const response = await apiClient.post('/catalogs', payload)
    return response.data.data
  },

  /**
   * Cuántos productos entran en un alcance, antes de generar. Permite avisar del
   * truncado a 100 en el formulario en vez de descubrirlo con el PDF ya hecho.
   */
  async previewCount(
    params: {
      scope: string
      category_id?: number
      brand_id?: number
      list_id?: number
      include_out_of_stock?: boolean
    }
  ): Promise<CatalogScopeCount> {
    const search = new URLSearchParams({ scope: params.scope })
    if (params.category_id) search.append('category_id', String(params.category_id))
    if (params.brand_id) search.append('brand_id', String(params.brand_id))
    if (params.list_id) search.append('list_id', String(params.list_id))
    // El conteo debe usar el mismo criterio de stock que la generación, o el
    // formulario anuncia un número y el PDF trae otro.
    if (params.include_out_of_stock) search.append('include_out_of_stock', '1')
    const response = await apiClient.get(`/catalogs/preview-count?${search.toString()}`)
    return response.data.data
  },

  /** Estado actual de un catálogo (endpoint de polling). */
  async getCatalog(id: number): Promise<Catalog> {
    const response = await apiClient.get(`/catalogs/${id}`)
    return response.data.data
  },

  /** Historial de catálogos de la tienda. */
  async listCatalogs(
    params: { page?: number; limit?: number } = {}
  ): Promise<{ data: Catalog[]; pagination: PaginationMeta }> {
    const search = new URLSearchParams()
    if (params.page) search.append('page', String(params.page))
    if (params.limit) search.append('limit', String(params.limit))
    const response = await apiClient.get(`/catalogs?${search.toString()}`)
    return { data: response.data.data, pagination: response.data.pagination }
  },

  /** Sube una imagen de portada a R2 y devuelve su URL pública. */
  async uploadCover(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('cover', file)
    const response = await apiClient.post('/catalogs/cover', formData)
    return response.data.data.cover_url
  },

  /** Elimina un catálogo del historial. */
  async deleteCatalog(id: number): Promise<void> {
    await apiClient.delete(`/catalogs/${id}`)
  }
}
