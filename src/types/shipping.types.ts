// Shipping Rates Types

export type CountryCode = 'PE' | 'EC' | 'CO'

export type DeliveryTimeUnit = 'days' | 'hours'

export type RateType = 'standard' | 'express' | 'same_day' | 'next_day'

// Tipo de servicio de envío (del catálogo global)
export interface ShippingServiceType {
  service_type_id: number
  service_type_code: RateType
  service_type_nombre: string
  service_type_descripcion?: string
  service_type_icono?: string
  service_type_orden: number
}

// Tarifa por tipo de servicio (tiendascoberturas_servicios)
export interface ServiceTypeRate {
  cobertura_servicio_id: number
  tienda_id: number
  ubigeo_id: number
  service_type_id: number
  service_type_code: string
  service_type_nombre: string
  precio: number
  tiempo_envio: number
  tipo_tiempo: number // 1=Días, 2=Horas
  activo: number
  departamento_nombre?: string
  provincia_nombre?: string
  distrito_nombre?: string
}

// Información de país
export interface Country {
  code: CountryCode
  name: string
  flag: string
  currency: string
  currencySymbol: string
  levels: string[] // ['Departamento', 'Provincia', 'Distrito'] para Perú
}

// Ubicación geográfica (ubigeo)
export interface Location {
  id: number
  code: string              // Código ubigeo completo
  name: string
  level: 1 | 2 | 3          // 1=Depto, 2=Provincia, 3=Distrito
  parentCode?: string       // Código del padre
  countryCode: CountryCode
}

// Tarifa de envío configurada
export interface ShippingRate {
  id: number
  locationId: number
  locationCode: string
  locationName: string
  locationFullName: string  // "Lima / Lima / Miraflores"
  level: 1 | 2 | 3
  countryCode: CountryCode
  price: number
  deliveryTime: number
  deliveryTimeUnit: DeliveryTimeUnit
  enabled: boolean
  // Preparado para futuro (nullable por ahora)
  rateType?: RateType
}

// Nodo del árbol para TreeTable
export interface RateTreeNode {
  key: string
  data: RateTreeNodeData
  children?: RateTreeNode[]
}

export interface RateTreeNodeData {
  id?: number               // ID de la tarifa (si existe)
  locationId: number
  code: string
  name: string
  fullName?: string         // Nombre completo con padres
  level: 1 | 2 | 3
  price?: number
  deliveryTime?: number
  deliveryTimeUnit?: DeliveryTimeUnit
  enabled?: boolean
  hasRate: boolean          // Si tiene tarifa configurada
  hasChildren: boolean      // Si tiene ubicaciones hijo
}

// Request para crear/actualizar tarifa
export interface SaveShippingRateRequest {
  locationId: number
  locationCode: string
  countryCode: CountryCode
  price: number
  deliveryTime: number
  deliveryTimeUnit: DeliveryTimeUnit
  enabled?: boolean
}

export interface UpdateShippingRateRequest {
  price?: number
  deliveryTime?: number
  deliveryTimeUnit?: DeliveryTimeUnit
  enabled?: boolean
}

// Catálogo de países soportados
export const SUPPORTED_COUNTRIES: Country[] = [
  {
    code: 'PE',
    name: 'Perú',
    flag: '🇵🇪',
    currency: 'PEN',
    currencySymbol: 'S/',
    levels: ['Departamento', 'Provincia', 'Distrito']
  },
  {
    code: 'EC',
    name: 'Ecuador',
    flag: '🇪🇨',
    currency: 'USD',
    currencySymbol: '$',
    levels: ['Provincia', 'Cantón', 'Parroquia']
  },
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    currencySymbol: '$',
    levels: ['Departamento', 'Municipio', '']
  }
]

// Helper para obtener país por código
export function getCountryByCode(code: CountryCode): Country | undefined {
  return SUPPORTED_COUNTRIES.find(c => c.code === code)
}

// Helper para formatear tiempo de entrega
export function formatDeliveryTime(time: number, unit: DeliveryTimeUnit): string {
  if (unit === 'hours') {
    return time === 1 ? '1 hora' : `${time} horas`
  }
  return time === 1 ? '1 día' : `${time} días`
}

// Helper para formatear precio con símbolo de moneda
export function formatPrice(price: number, countryCode: CountryCode): string {
  const country = getCountryByCode(countryCode)
  const symbol = country?.currencySymbol || 'S/'
  return `${symbol} ${price.toFixed(2)}`
}

// --- Shipping Config Types ---

export interface ShippingScheduleDay {
  enabled: boolean
  start: string // "09:00"
  end: string // "18:00"
}

// Legacy format: { "1": { enabled, start, end }, ..., "7": {...} }
export type ShippingSchedule = Record<string, ShippingScheduleDay>

// [year, month, day]
export type BlockedDate = [number, number, number]

export interface ShippingConfig {
  // Delivery methods
  swEntregaADomicilio: boolean
  swRecojoEnTienda: boolean
  // Free shipping
  swRepartoGratis: boolean
  montoRepartoGratis: number
  zonaRepartoGratis: number | null
  // Dispatch
  swHabilitarEstadoEnvio: boolean
  // Shipping cost method: 0=single price, 1=highest, 2=sum
  envioporProducto: number
  // Service types (differentiated shipping rates)
  swServiciosEnvio: boolean
  // Delivery schedule
  swMostrarHorarioEnvio: boolean
  horarioEnvio: ShippingSchedule | null
  tipoMostrarFecha: 1 | 2 // 1=dropdown, 2=calendar
  swRepartoHoy: number // 0-10 days in advance
  // Blocked dates
  diasBloqueados: BlockedDate[]
  // Pickup schedule
  swMostrarHorarioRecojoTienda: boolean
  horarioRecojoTienda: ShippingSchedule | null
  tipoMostrarFechaRecojoTienda: 1 | 2
  swRecojoTiendaHoy: number
  plazoMaximoRecojoTienda: number
}
