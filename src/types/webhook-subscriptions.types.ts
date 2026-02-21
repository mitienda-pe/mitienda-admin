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
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  processed_at: string | null
  deliveries?: WebhookDelivery[]
}

export interface EventStats {
  by_status: Array<{ status: string; count: number }>
  by_type: Array<{ event_type: string; count: number }>
  today: number
}
