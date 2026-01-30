import apiClient from './axios'
import type { LegalPageSummary, LegalPageDetail } from '@/types/legal-page.types'

export const legalPagesApi = {
  async getAll(): Promise<LegalPageSummary[]> {
    const response = await apiClient.get('/legal-pages')
    return response.data.data || []
  },

  async getBySlug(slug: string): Promise<LegalPageDetail> {
    const response = await apiClient.get(`/legal-pages/${slug}`)
    return response.data.data
  },

  async update(slug: string, content: string): Promise<void> {
    await apiClient.put(`/legal-pages/${slug}`, { content })
  },
}
