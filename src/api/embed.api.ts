import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { StorefrontEmbed, StorefrontEmbedFormData } from '@/types/embed.types'

export const embedApi = {
  async getAll(): Promise<ApiResponse<StorefrontEmbed[]>> {
    const response = await apiClient.get('/embeds')
    return { success: true, data: (response.data?.data ?? []) as StorefrontEmbed[] }
  },

  async getById(id: number): Promise<ApiResponse<StorefrontEmbed>> {
    const response = await apiClient.get(`/embeds/${id}`)
    return { success: true, data: response.data?.data }
  },

  async create(data: StorefrontEmbedFormData): Promise<StorefrontEmbed> {
    const response = await apiClient.post('/embeds', data)
    return response.data?.data as StorefrontEmbed
  },

  async update(id: number, data: StorefrontEmbedFormData): Promise<StorefrontEmbed> {
    const response = await apiClient.put(`/embeds/${id}`, data)
    return response.data?.data as StorefrontEmbed
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/embeds/${id}`)
  }
}

/**
 * URL del documento del bloque, con la firma que deja ver un borrador. Es la
 * misma que carga la tienda, así que la vista previa corre con el mismo
 * aislamiento que va a tener publicada.
 */
export function embedPreviewUrl(embed: Pick<StorefrontEmbed, 'embed_path' | 'preview_token'>): string {
  const base = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
  return `${base}${embed.embed_path}?pv=${encodeURIComponent(embed.preview_token)}`
}
