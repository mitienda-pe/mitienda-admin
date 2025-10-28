// API Credentials Types

export interface StoreCredential {
  tiendacredencial_id: number
  tienda_id: number
  tiendacredencial_token: string
  tiendacredencial_fechacreacion: string
  tiendacredencial_fechabaja: string | null
  tiendacredencial_estado: number
}

export interface CreateTokenResponse {
  token: string
  created_at: string
}

export interface RenewTokenResponse {
  token: string
  renewed_at: string
}

// Webhook Types

export enum WebhookType {
  ORDER_CONFIRMATION = 1,
  CUSTOMER_REGISTRATION = 100,
  PRODUCT_UPDATE = 10
}

export interface StoreWebhook {
  tiendawebhook_id: number
  tienda_id: number
  tiendawebhook_url: string
  tiendawebhook_tipo: WebhookType
  tiendawebhook_personalizado: number
}

export interface WebhookInput {
  tiendawebhook_url: string
  tiendawebhook_tipo: WebhookType
}

export interface SaveWebhooksRequest {
  webhooks: Array<{
    tiendawebhook_id?: number
    tiendawebhook_tipo: WebhookType
    tiendawebhook_url: string
  }>
}

// API Logs Types

export interface ApiLog {
  tiendasLog_id: number
  tienda_id: number
  tiendasLog_tipo: string // GET, POST, PUT, DELETE
  tiendasLog_tipohook: string // endpoint URI
  tiendasLog_fechapeticion: string
  tiendasLog_tiempopeticion: string
  tiendasLog_bodypeticion: string
  tiendasLog_response_code: number
}

export interface ApiLogSummary {
  method: string
  uri: string
  time: string
  response_time: string
  params: string
}
