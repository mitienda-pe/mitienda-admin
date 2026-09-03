export interface IntegrationProviderField {
  key: string
  label: string
  type: 'text' | 'password' | 'select'
  required: boolean
  /** Required to configure the provider, but not to edit it afterwards (e.g. one-time OAuth grant tokens) */
  required_on_create_only?: boolean
  placeholder?: string
  help?: string
  default?: string
  options?: { label: string; value: string }[]
}

/**
 * Estado del índice del Asistente IA (`shopping_chat`), el único proveedor que lo
 * tiene. Su catálogo se indexa en el backend RAG, y hasta que eso termina la API
 * no publica el widget en la tienda: `enabled` sin `indexed` es el estado
 * intermedio que hay que explicarle al comerciante.
 */
export interface IntegrationIndexingStatus {
  indexed?: boolean
  indexed_at?: string | null
  indexed_products?: number | null
  /** El sync corrió y la tienda no tiene productos publicados que indexar */
  index_empty?: boolean
  /** El plan de la tienda habilita el indexado; si es false no va a indexarse nunca */
  index_eligible?: boolean
}

export interface IntegrationProvider extends IntegrationIndexingStatus {
  code: string
  name: string
  description: string
  supported_events: string[]
  config_fields: IntegrationProviderField[]
  configured: boolean
  enabled: boolean
  category?: string
  frontend_only?: boolean
  consent_category?: string
  config_url?: string
  last_success_at?: string | null
  last_failure_at?: string | null
  last_error?: string | null
}

export interface IntegrationProviderConfig extends IntegrationIndexingStatus {
  provider: IntegrationProvider
  credentials: Record<string, string | null> | null
  config: IntegrationProviderEventConfig | null
  enabled: boolean
  configured: boolean
  last_success_at?: string | null
  last_failure_at?: string | null
  last_error?: string | null
}

export interface IntegrationProviderEventConfig {
  events: string[]
  [key: string]: unknown
}

export interface SaveIntegrationProviderRequest {
  credentials: Record<string, string>
  config?: IntegrationProviderEventConfig
}

export interface TestConnectionResult {
  success: boolean
  message: string
}
