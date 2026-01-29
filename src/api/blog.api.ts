import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { BlogPost, BlogPostFormData, BlogCategory, BlogCategoryFormData } from '@/types/blog.types'

// Transform raw API response to BlogPost
const transformPost = (raw: any): BlogPost => ({
  id: parseInt(raw.tiendasblogentrada_id),
  tienda_id: parseInt(raw.tienda_id),
  category_id: raw.tiendasblogcategoria_id ? parseInt(raw.tiendasblogcategoria_id) : null,
  category_name: raw.category_name || null,
  image_id: raw.tiendaimagen_id ? parseInt(raw.tiendaimagen_id) : null,
  title: raw.tiendasblogentrada_titulo,
  slug: raw.tiendasblogentrada_slug || '',
  description: raw.tiendasblogentrada_descripcion || '',
  excerpt: raw.tiendasblogentrada_extracto || '',
  content: raw.tiendasblogentrada_contenido || '',
  editor_type: raw.tiendasblogentrada_editor_type || 'wysiwyg',
  active: parseInt(raw.tiendasblogentrada_estado) === 1,
  published: parseInt(raw.tiendasblogentrada_publicado) === 1,
  publication_date: raw.tiendasblogentrada_publicacion,
  author: raw.tiendasblogentrada_autor || '',
  created_at: raw.tiendasblogentrada_creacion,
  updated_at: raw.tiendasblogentrada_modificacion,
})

const transformCategory = (raw: any): BlogCategory => ({
  id: parseInt(raw.tiendasblogcategoria_id),
  tienda_id: parseInt(raw.tienda_id),
  name: raw.tiendasblogcategorias_nombre,
  slug: raw.tiendasblogcategorias_url,
})

const transformPostToApi = (data: BlogPostFormData): Record<string, any> => {
  const result: Record<string, any> = {}
  if (data.title !== undefined) result.title = data.title
  if (data.slug !== undefined) result.slug = data.slug
  if (data.description !== undefined) result.description = data.description
  if (data.excerpt !== undefined) result.excerpt = data.excerpt
  if (data.content !== undefined) result.content = data.content
  if (data.editor_type !== undefined) result.editor_type = data.editor_type
  if (data.category_id !== undefined) result.category_id = data.category_id
  if (data.published !== undefined) result.published = data.published ? 1 : 0
  if (data.publication_date !== undefined) result.publication_date = data.publication_date
  if (data.author !== undefined) result.author = data.author
  return result
}

export const blogPostsApi = {
  async getAll(): Promise<ApiResponse<BlogPost[]>> {
    const response = await apiClient.get('/blog-posts')
    const rawData = response.data
    if (rawData.success && Array.isArray(rawData.data)) {
      return { success: true, data: rawData.data.map(transformPost) }
    }
    return { success: false, data: [] }
  },

  async getById(id: number): Promise<ApiResponse<BlogPost>> {
    const response = await apiClient.get(`/blog-posts/${id}`)
    const rawData = response.data
    if (rawData.success && rawData.data) {
      return { success: true, data: transformPost(rawData.data) }
    }
    return { success: false }
  },

  async create(data: BlogPostFormData): Promise<ApiResponse<BlogPost>> {
    const response = await apiClient.post('/blog-posts', transformPostToApi(data))
    const rawData = response.data
    if (rawData.success && rawData.data) {
      return { success: true, data: transformPost(rawData.data) }
    }
    return { success: false, message: rawData.message }
  },

  async update(id: number, data: Partial<BlogPostFormData>): Promise<ApiResponse<BlogPost>> {
    const response = await apiClient.put(`/blog-posts/${id}`, transformPostToApi(data as BlogPostFormData))
    const rawData = response.data
    if (rawData.success && rawData.data) {
      return { success: true, data: transformPost(rawData.data) }
    }
    return { success: false, message: rawData.message }
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/blog-posts/${id}`)
    return { success: true }
  },

  async togglePublished(id: number): Promise<ApiResponse<BlogPost>> {
    const response = await apiClient.put(`/blog-posts/${id}/toggle-published`)
    const rawData = response.data
    if (rawData.success && rawData.data) {
      return { success: true, data: transformPost(rawData.data) }
    }
    return { success: false }
  },

  async checkSlug(slug: string, excludeId?: number): Promise<{ available: boolean; slug: string }> {
    const response = await apiClient.post('/blog-posts/check-slug', { slug, exclude_id: excludeId })
    return response.data
  },
}

export const blogCategoriesApi = {
  async getAll(): Promise<ApiResponse<BlogCategory[]>> {
    const response = await apiClient.get('/blog-categories')
    const rawData = response.data
    if (rawData.success && Array.isArray(rawData.data)) {
      return { success: true, data: rawData.data.map(transformCategory) }
    }
    return { success: false, data: [] }
  },

  async create(data: BlogCategoryFormData): Promise<ApiResponse<BlogCategory>> {
    const response = await apiClient.post('/blog-categories', data)
    const rawData = response.data
    if (rawData.success && rawData.data) {
      return { success: true, data: transformCategory(rawData.data) }
    }
    return { success: false, message: rawData.message }
  },

  async update(id: number, data: BlogCategoryFormData): Promise<ApiResponse<BlogCategory>> {
    const response = await apiClient.put(`/blog-categories/${id}`, data)
    const rawData = response.data
    if (rawData.success && rawData.data) {
      return { success: true, data: transformCategory(rawData.data) }
    }
    return { success: false, message: rawData.message }
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/blog-categories/${id}`)
    return { success: true }
  },
}
