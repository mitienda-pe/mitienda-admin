import apiClient from './axios'

/**
 * La base de conocimiento del asistente de compras: artículos en markdown que
 * el comerciante escribe y el asistente usa para responder.
 *
 * El `tienda_id` sale del token, así que no hay parámetro para pedir los de otra
 * tienda: estos endpoints solo saben devolver los propios.
 */
export interface KnowledgeArticleSummary {
  id: number
  titulo: string
  publicado: boolean
  caracteres: number
  actualizado_en: string | null
}

export interface KnowledgeArticle {
  id: number
  titulo: string
  contenido: string
  publicado: boolean
  actualizado_en: string | null
}

export interface KnowledgeLimits {
  titulo: number
  contenido: number
}

/**
 * Si el asistente ya se enteró del cambio.
 *
 * - `indexado`: ya responde con esto.
 * - `pendiente`: se guardó, pero no se le pudo avisar; lo toma en su próximo
 *   repaso, que corre cada 6 horas.
 * - `inactivo`: la tienda no tiene el asistente activo.
 */
export type KnowledgeIndexing = 'indexado' | 'pendiente' | 'inactivo'

export interface KnowledgeInput {
  titulo?: string
  contenido?: string
  publicado?: boolean
}

const FALLBACK_LIMITS: KnowledgeLimits = { titulo: 160, contenido: 20000 }

export const assistantKnowledgeApi = {
  async list(): Promise<{ articles: KnowledgeArticleSummary[]; limits: KnowledgeLimits }> {
    const { data } = await apiClient.get('/asistente/articulos')
    return {
      articles: data?.data ?? [],
      limits: data?.limites ?? FALLBACK_LIMITS,
    }
  },

  async get(id: number): Promise<KnowledgeArticle> {
    const { data } = await apiClient.get(`/asistente/articulos/${id}`)
    return data.data
  },

  async create(input: KnowledgeInput): Promise<{ article: KnowledgeArticle; indexing: KnowledgeIndexing }> {
    const { data } = await apiClient.post('/asistente/articulos', input)
    return { article: data.data, indexing: data.indexacion }
  },

  async update(
    id: number,
    input: KnowledgeInput
  ): Promise<{ article: KnowledgeArticle; indexing: KnowledgeIndexing }> {
    const { data } = await apiClient.put(`/asistente/articulos/${id}`, input)
    return { article: data.data, indexing: data.indexacion }
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/asistente/articulos/${id}`)
  },
}
