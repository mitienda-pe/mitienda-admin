import apiClient from './axios'
import type { PaginationMeta } from '@/types/api.types'
import type { Catalog, CreateCatalogPayload } from '@/types/catalog-pdf.types'

/**
 * API de catálogos PDF (generación asíncrona).
 *
 * El interceptor de axios normaliza `{ error: 0, data }` → `{ success, data }` y
 * preserva `pagination`. La descarga del PDF es directa vía `catalog.r2_url`
 * (URL pública de R2), no requiere blob.
 */
export const catalogPdfApi = {
  /** Crea una solicitud de catálogo y devuelve su id (estado inicial `queued`). */
  async createCatalog(payload: CreateCatalogPayload): Promise<{ catalog_id: number; status: string }> {
    const response = await apiClient.post('/catalogs', payload)
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
