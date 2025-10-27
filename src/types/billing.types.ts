// Billing Provider Types

export interface BillingProvider {
  id: number
  name: string
  description: string
  logo: string
}

export type BillingEnvironment = 'produccion' | 'prueba'

// Nubefact Types

export interface NubefactCredentials {
  api_token: string
  api_secret: string
  clave_secreta?: string
  emisor?: string
  tipo_documento: string
  numero_documento: string
  razon_social: string
  direccion_fiscal: string
  urbanizacion?: string
  serie_factura?: string
  numero_factura?: string
  serie_boleta?: string
  numero_boleta?: string
  environment: BillingEnvironment
}

export interface NubefactConfig {
  configured: boolean
  provider: string
  blocked?: boolean
  credentials: NubefactCredentials | null
}

export interface NubefactConfigResponse {
  provider: BillingProvider
  configured: boolean
  blocked?: boolean
  credentials: NubefactCredentials | null
}

export interface SaveNubefactCredentialsRequest {
  api_token: string
  api_secret?: string
  clave_secreta?: string
  emisor?: string
  numero_documento: string
  razon_social: string
  direccion_fiscal: string
  urbanizacion?: string
  serie_factura?: string
  numero_factura?: string
  serie_boleta?: string
  numero_boleta?: string
  environment?: BillingEnvironment
  blocked?: boolean
}

export interface TestConnectionResponse {
  connected: boolean
  environment: BillingEnvironment
  message?: string
}
