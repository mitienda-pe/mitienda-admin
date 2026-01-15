// Shipping Rates Types

export type CountryCode = 'PE' | 'EC' | 'CO'

export type DeliveryTimeUnit = 'days' | 'hours'

export type RateType = 'standard' | 'express' | 'same_day' | 'next_day'

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
