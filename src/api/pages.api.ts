import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { Page, PageFormData } from '@/types/page.types'

// Transform raw API response to Page
const transformPage = (raw: any): Page => ({
  id: parseInt(raw.tiendapagina_id),
  tienda_id: parseInt(raw.tienda_id),
  title: raw.tiendapagina_titulo,
  slug: raw.tiendapagina_url,
  content: raw.tiendapagina_contenido || '',
  editor_type: raw.tiendapagina_editor_type || 'wysiwyg',
  published: parseInt(raw.tiendapagina_publicado) === 1,
  meta_title: raw.tiendapagina_meta_titulo || null,
  meta_description: raw.tiendapagina_meta_descripcion || null,
  created_at: raw.tiendapagina_fechacreacion,
  updated_at: raw.tiendapagina_fechamodificacion,
})

// Transform form data to API format
const transformToApi = (data: PageFormData): Record<string, any> => {
  const result: Record<string, any> = {}

  if (data.title !== undefined) result.title = data.title
  if (data.slug !== undefined) result.slug = data.slug
  if (data.content !== undefined) result.content = data.content
  if (data.editor_type !== undefined) result.editor_type = data.editor_type
  if (data.published !== undefined) result.published = data.published ? 1 : 0
  if (data.meta_title !== undefined) result.meta_title = data.meta_title
  if (data.meta_description !== undefined) result.meta_description = data.meta_description

  return result
}

export const pagesApi = {
  // List all pages
  async getAll(): Promise<ApiResponse<Page[]>> {
    const response = await apiClient.get('/pages')
    const rawData = response.data

    if (rawData.success && Array.isArray(rawData.data)) {
      const pages = rawData.data.map(transformPage)
      return { success: true, data: pages }
    }

    return { success: false, data: [] }
  },

  // Get single page by ID
  async getById(id: number): Promise<ApiResponse<Page>> {
    const response = await apiClient.get(`/pages/${id}`)
    const rawData = response.data

    if (rawData.success && rawData.data) {
      const page = transformPage(rawData.data)
      return { success: true, data: page }
    }

    return { success: false }
  },

  // Create new page
  async create(data: PageFormData): Promise<ApiResponse<Page>> {
    const response = await apiClient.post('/pages', transformToApi(data))
    const rawData = response.data

    if (rawData.success && rawData.data) {
      const page = transformPage(rawData.data)
      return { success: true, data: page }
    }

    return { success: false, message: rawData.message }
  },

  // Update existing page
  async update(id: number, data: Partial<PageFormData>): Promise<ApiResponse<Page>> {
    const response = await apiClient.put(`/pages/${id}`, transformToApi(data as PageFormData))
    const rawData = response.data

    if (rawData.success && rawData.data) {
      const page = transformPage(rawData.data)
      return { success: true, data: page }
    }

    return { success: false, message: rawData.message }
  },

  // Delete page
  async delete(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/pages/${id}`)
    return { success: true }
  },

  // Toggle published status
  async togglePublished(id: number): Promise<ApiResponse<Page>> {
    const response = await apiClient.put(`/pages/${id}/toggle-published`)
    const rawData = response.data

    if (rawData.success && rawData.data) {
      const page = transformPage(rawData.data)
      return { success: true, data: page }
    }

    return { success: false }
  },

  // Check slug availability
  async checkSlug(slug: string, excludeId?: number): Promise<{ available: boolean; slug: string }> {
    const response = await apiClient.post('/pages/check-slug', {
      slug,
      exclude_id: excludeId,
    })
    return response.data
  },
}
