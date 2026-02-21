export interface IntegrationProviderField {
  key: string
  label: string
  type: 'text' | 'password' | 'select'
  required: boolean
  placeholder?: string
  help?: string
  options?: { label: string; value: string }[]
}

export interface IntegrationProvider {
  code: string
  name: string
  description: string
  supported_events: string[]
  config_fields: IntegrationProviderField[]
  configured: boolean
  enabled: boolean
  config_url?: string
  last_success_at?: string | null
  last_failure_at?: string | null
  last_error?: string | null
}

export interface IntegrationProviderConfig {
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
