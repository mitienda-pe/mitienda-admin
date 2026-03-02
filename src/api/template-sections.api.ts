import apiClient from './axios'
import type { PageSection } from '@/types/template-section.types'

export const templateSectionsApi = {
  async getPage(page: number): Promise<PageSection[]> {
    const response = await apiClient.get('/template-sections', { params: { page } })
    if (response.data.success && Array.isArray(response.data.data?.sections)) {
      return response.data.data.sections as PageSection[]
    }
    return []
  },

  async savePage(page: number, sections: PageSection[]): Promise<boolean> {
    const response = await apiClient.post(`/template-sections/${page}`, { sections })
    return response.data.success === true
  },
}
