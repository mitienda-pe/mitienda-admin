export type CourierEnvironment = 'produccion' | 'prueba'

export interface CourierProvider {
  id: number
  code: string
  name: string
  logo: string
  description: string
  configured: boolean
  enabled: boolean
  environment?: CourierEnvironment | null
}

export interface CourierProviderConfig {
  courier: CourierProvider
  credentials: Record<string, string | boolean | number | null> | null
}

export interface SaveCourierConfigRequest {
  credentials: Record<string, unknown>
}

export interface CalculatePriceRequest {
  origin: {
    lat?: number
    lng?: number
    address?: string
  }
  destination: {
    lat?: number
    lng?: number
    address?: string
  }
  vehicle_type?: number
  service_type?: number
  weight?: number
  country?: string
}

export interface CreateOrderRequest {
  order_data: Record<string, unknown>
}

// Urbaner-specific types
export interface UrbanerCredentials {
  api_key: string
  latitude: string
  longitude: string
  services: string // JSON
  vehicle_type: string
  sender_name: string
  sender_email: string
  sender_phone: string
  origin_address: string
  origin_interior: string
  origin_reference: string
  environment: CourierEnvironment
}

export interface UrbanerService {
  id: number
  name?: string
  tipo?: string
}

export type Minutos99ApiVersion = 'v1' | 'v3'

// 99 Minutos-specific types
export interface Minutos99Credentials {
  api_key: string          // v1: API Key, v3: "client_id|client_secret"
  sender_first_name: string
  sender_last_name: string
  sender_email: string
  sender_phone: string
  origin_address: string
  origin_interior: string
  country: string
  services: string // JSON
  environment: CourierEnvironment
  company_name: string
  api_version: Minutos99ApiVersion
}
