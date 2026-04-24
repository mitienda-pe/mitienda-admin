import apiClient from './axios'

export interface PluginAssignment {
  assignment_id: number
  plugin_id: number
  slug: string
  name: string
  description?: string | null
  slots: string[]
  pricingMode: 'none' | 'per_unit' | 'base_plus_addons'
  productoId: number | null
  categoriaId: number | null
  config: Record<string, any> | null
  configSchema: Record<string, any> | null
}

export interface PluginConfigPayload {
  slug: string
  config: Record<string, any>
  configSchema?: Record<string, any> | null
}

export const pluginsApi = {
  list: async (): Promise<PluginAssignment[]> => {
    const response = await apiClient.get<{ error: number; data: PluginAssignment[] }>('/plugins')
    return response.data.data
  },

  getConfig: async (slug: string): Promise<PluginConfigPayload> => {
    const response = await apiClient.get<{ error: number; data: PluginConfigPayload }>(
      `/plugins/${encodeURIComponent(slug)}/config`
    )
    return response.data.data
  },

  updateConfig: async (
    slug: string,
    config: Record<string, any>
  ): Promise<PluginConfigPayload> => {
    const response = await apiClient.put<{ error: number; data: PluginConfigPayload }>(
      `/plugins/${encodeURIComponent(slug)}/config`,
      { config }
    )
    return response.data.data
  },
}
