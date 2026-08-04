import apiClient from './axios'
import type { PageSection, HomeModo } from '@/types/template-section.types'

export interface TemplatePageResponse {
  sections: PageSection[]
  /** Solo significativo en la página 1 (Home). */
  modo: HomeModo
}

export const templateSectionsApi = {
  async getPage(page: number): Promise<TemplatePageResponse> {
    const response = await apiClient.get('/template-sections', { params: { page } })
    const sections = Array.isArray(response.data.data?.sections)
      ? (response.data.data.sections as PageSection[])
      : []
    // APIs anteriores no devuelven `modo`; 'auto' es el default del backend.
    const raw = response.data.data?.modo
    const modo: HomeModo = raw === 'plantilla' || raw === 'catalogo' ? raw : 'auto'

    if (!response.data.success) {
      return { sections: [], modo }
    }

    return { sections, modo }
  },

  async savePage(page: number, sections: PageSection[], modo?: HomeModo): Promise<boolean> {
    const payload: { sections: PageSection[]; modo?: HomeModo } = { sections }
    if (modo) payload.modo = modo

    const response = await apiClient.post(`/template-sections/${page}`, payload)
    return response.data.success === true
  },
}
