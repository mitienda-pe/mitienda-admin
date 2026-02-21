export interface WebhookSubscription {
  id: number
  tienda_id: number
  url: string
  secret: string
  events: string[]
  status: 'active' | 'paused' | 'disabled'
  failure_count: number
  last_success_at: string | null
  last_failure_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: number
  subscription_id: number
  event_id: number
  event_type: string
  url: string
  request_headers: string | null
  request_body: string | null
  response_code: number | null
  response_body: string | null
  attempt: number
  duration_ms: number | null
  status: 'success' | 'failed' | 'pending'
  created_at: string
}

export interface AvailableEvent {
  type: string
  label: string
  description: string
}

export interface CreateWebhookPayload {
  url: string
  events: string[]
}

export interface UpdateWebhookPayload {
  url?: string
  events?: string[]
  status?: 'active' | 'paused'
}

export interface DomainEvent {
  id: number
  event_type: string
  tienda_id: number
  aggregate_type: string
  aggregate_id: number
  payload: Record<string, any>
  idempotency_key: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter'
  retry_count: number
  dead_letter_at: string | null
  created_at: string
  processed_at: string | null
  deliveries?: WebhookDelivery[]
  adapter_deliveries?: AdapterDelivery[]
}

export interface AdapterDelivery {
  id: number
  event_id: number
  provider: string
  event_type: string
  status: 'success' | 'failed'
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

export interface EventStats {
  by_status: Array<{ status: string; count: number }>
  by_type: Array<{ event_type: string; count: number }>
  today: number
}

export interface DashboardSummary {
  today: number
  by_status: Array<{ status: string; count: number }>
  success_rate: number
  queue_depth: number
  oldest_pending_at: string | null
}

export interface DashboardProviderStat {
  provider: string
  total: number
  success_count: number
  failed_count: number
  avg_duration_ms: number | null
  last_activity: string | null
}

export interface DashboardWebhookHealth {
  id: number
  url: string
  status: string
  failure_count: number
  last_success_at: string | null
  last_failure_at: string | null
  circuit_opened_at: string | null
  rate_limit_per_minute: number
  deliveries_7d: number
  success_7d: number
  avg_duration_ms: number | null
}

export interface DashboardAlert {
  level: 'danger' | 'warning'
  message: string
}

export interface DashboardData {
  summary: DashboardSummary
  events_over_time: Array<{ date: string; status: string; count: number }>
  provider_stats: DashboardProviderStat[]
  webhook_health: DashboardWebhookHealth[]
  alerts: DashboardAlert[]
}
