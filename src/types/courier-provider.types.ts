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
    zipcode?: string
    ubigeo?: string
    [key: string]: unknown
  }
  destination: {
    lat?: number
    lng?: number
    address?: string
    zipcode?: string
    ubigeo?: string
    [key: string]: unknown
  }
  vehicle_type?: number
  service_type?: number
  weight?: number
  country?: string
  taxi_class?: string
  package_value?: number
  height?: number
  length?: number
  width?: number
  [key: string]: unknown
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

// Chazki-specific types
export interface ChazkiCredentials {
  enterprise_key: string
  store_id: string
  branch_id: string
  services: string // JSON array of enabled services
  sender_name: string
  sender_email: string
  sender_phone: string
  origin_address: string
  origin_district: string
  origin_reference: string
  origin_latitude: string
  origin_longitude: string
}

export type ChazkiServiceType = 'Regular' | 'Express' | 'Programado'

// Urbano-specific types
export interface UrbanoCredentials {
  api_key: string
  contrato: string
  seller_id: string
  seller_name: string
  sender_name: string
  sender_phone: string
  origin_address: string
  origin_ubigeo: string
  origin_region: string
  origin_provincia: string
  origin_ciudad: string
  environment: CourierEnvironment
}

// Yango-specific types
export interface YangoCredentials {
  api_token: string
  taxi_class: string
  sender_name: string
  sender_email: string
  sender_phone: string
  origin_address: string
  origin_latitude: string
  origin_longitude: string
  origin_comment: string
  callback_url: string
}

// HOP-specific types
export interface HopCredentials {
  client_id: string
  client_secret: string
  email: string
  password: string
  seller_code: string
  sender_name: string
  sender_phone: string
  origin_address: string
  origin_zipcode: string
  country: string
  environment: CourierEnvironment
}

// Nirex-specific types
export interface NirexCredentials {
  api_key: string
  sender_name: string
  sender_email: string
  sender_phone: string
  origin_address: string
  origin_district: string
  origin_reference: string
  environment: CourierEnvironment
}
