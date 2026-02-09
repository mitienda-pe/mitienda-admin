import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  CountryCode,
  Location,
  ShippingRate,
  RateTreeNode,
  SaveShippingRateRequest,
  UpdateShippingRateRequest,
  Country
} from '@/types/shipping.types'
import { SUPPORTED_COUNTRIES } from '@/types/shipping.types'

// Flag para usar mocks mientras el backend no esté listo
const USE_MOCKS = true

// Mapping from ISO country code to ubigeo codPais
const COUNTRY_COD_PAIS: Record<CountryCode, number> = {
  PE: 1,
  EC: 58,
  CO: 46
}

// Mock: países habilitados para la tienda actual (normalmente viene del backend)
// Cambiar esto para simular diferentes configuraciones de tienda
const MOCK_STORE_ENABLED_COUNTRIES: CountryCode[] = ['PE', 'EC', 'CO']  // Los 3 países

// Mock data para desarrollo - Perú
const MOCK_PERU_TREE: RateTreeNode[] = [
  {
    key: '15',
    data: {
      id: 1,
      locationId: 1,
      code: '15',
      name: 'Lima',
      fullName: 'Lima',
      level: 1,
      price: 10,
      deliveryTime: 2,
      deliveryTimeUnit: 'days',
      enabled: true,
      hasRate: true,
      hasChildren: true
    },
    children: [
      {
        key: '1501',
        data: {
          id: 2,
          locationId: 2,
          code: '1501',
          name: 'Lima',
          fullName: 'Lima / Lima',
          level: 2,
          price: 8,
          deliveryTime: 1,
          deliveryTimeUnit: 'days',
          enabled: true,
          hasRate: true,
          hasChildren: true
        },
        children: [
          {
            key: '150101',
            data: {
              id: 3,
              locationId: 3,
              code: '150101',
              name: 'Lima (Cercado)',
              fullName: 'Lima / Lima / Lima (Cercado)',
              level: 3,
              price: 5,
              deliveryTime: 4,
              deliveryTimeUnit: 'hours',
              enabled: true,
              hasRate: true,
              hasChildren: false
            }
          },
          {
            key: '150102',
            data: {
              id: 4,
              locationId: 4,
              code: '150102',
              name: 'Ancón',
              fullName: 'Lima / Lima / Ancón',
              level: 3,
              price: 12,
              deliveryTime: 1,
              deliveryTimeUnit: 'days',
              enabled: true,
              hasRate: true,
              hasChildren: false
            }
          },
          {
            key: '150103',
            data: {
              id: 5,
              locationId: 5,
              code: '150103',
              name: 'Ate',
              fullName: 'Lima / Lima / Ate',
              level: 3,
              price: 6,
              deliveryTime: 6,
              deliveryTimeUnit: 'hours',
              enabled: true,
              hasRate: true,
              hasChildren: false
            }
          },
          {
            key: '150104',
            data: {
              id: 6,
              locationId: 6,
              code: '150104',
              name: 'Barranco',
              fullName: 'Lima / Lima / Barranco',
              level: 3,
              price: 5,
              deliveryTime: 4,
              deliveryTimeUnit: 'hours',
              enabled: true,
              hasRate: true,
              hasChildren: false
            }
          },
          {
            key: '150105',
            data: {
              id: 7,
              locationId: 7,
              code: '150105',
              name: 'Breña',
              fullName: 'Lima / Lima / Breña',
              level: 3,
              price: 5,
              deliveryTime: 4,
              deliveryTimeUnit: 'hours',
              enabled: true,
              hasRate: true,
              hasChildren: false
            }
          },
          {
            key: '150112',
            data: {
              id: 8,
              locationId: 8,
              code: '150112',
              name: 'La Victoria',
              fullName: 'Lima / Lima / La Victoria',
              level: 3,
              price: 5,
              deliveryTime: 4,
              deliveryTimeUnit: 'hours',
              enabled: true,
              hasRate: true,
              hasChildren: false
            }
          },
          {
            key: '150114',
            data: {
              id: 9,
              locationId: 9,
              code: '150114',
              name: 'Miraflores',
              fullName: 'Lima / Lima / Miraflores',
              level: 3,
              price: 5,
              deliveryTime: 4,
              deliveryTimeUnit: 'hours',
              enabled: true,
              hasRate: true,
              hasChildren: false
            }
          },
          {
            key: '150131',
            data: {
              id: 10,
              locationId: 10,
              code: '150131',
              name: 'San Isidro',
              fullName: 'Lima / Lima / San Isidro',
              level: 3,
              price: 5,
              deliveryTime: 4,
              deliveryTimeUnit: 'hours',
              enabled: true,
              hasRate: true,
              hasChildren: false
            }
          },
          {
            key: '150133',
            data: {
              id: 11,
              locationId: 11,
              code: '150133',
              name: 'San Miguel',
              fullName: 'Lima / Lima / San Miguel',
              level: 3,
              price: 6,
              deliveryTime: 5,
              deliveryTimeUnit: 'hours',
              enabled: true,
              hasRate: true,
              hasChildren: false
            }
          },
          {
            key: '150140',
            data: {
              id: 12,
              locationId: 12,
              code: '150140',
              name: 'Santiago de Surco',
              fullName: 'Lima / Lima / Santiago de Surco',
              level: 3,
              price: 6,
              deliveryTime: 5,
              deliveryTimeUnit: 'hours',
              enabled: false,
              hasRate: true,
              hasChildren: false
            }
          }
        ]
      },
      {
        key: '1502',
        data: {
          id: 13,
          locationId: 13,
          code: '1502',
          name: 'Barranca',
          fullName: 'Lima / Barranca',
          level: 2,
          price: 20,
          deliveryTime: 3,
          deliveryTimeUnit: 'days',
          enabled: true,
          hasRate: true,
          hasChildren: false
        }
      },
      {
        key: '1503',
        data: {
          id: 14,
          locationId: 14,
          code: '1503',
          name: 'Cajatambo',
          fullName: 'Lima / Cajatambo',
          level: 2,
          price: 25,
          deliveryTime: 4,
          deliveryTimeUnit: 'days',
          enabled: true,
          hasRate: true,
          hasChildren: false
        }
      },
      {
        key: '1504',
        data: {
          id: 15,
          locationId: 15,
          code: '1504',
          name: 'Canta',
          fullName: 'Lima / Canta',
          level: 2,
          price: 22,
          deliveryTime: 3,
          deliveryTimeUnit: 'days',
          enabled: true,
          hasRate: true,
          hasChildren: false
        }
      },
      {
        key: '1506',
        data: {
          id: 16,
          locationId: 16,
          code: '1506',
          name: 'Huaral',
          fullName: 'Lima / Huaral',
          level: 2,
          price: 15,
          deliveryTime: 2,
          deliveryTimeUnit: 'days',
          enabled: true,
          hasRate: true,
          hasChildren: false
        }
      },
      {
        key: '1507',
        data: {
          id: 17,
          locationId: 17,
          code: '1507',
          name: 'Huarochirí',
          fullName: 'Lima / Huarochirí',
          level: 2,
          price: 18,
          deliveryTime: 2,
          deliveryTimeUnit: 'days',
          enabled: true,
          hasRate: true,
          hasChildren: false
        }
      }
    ]
  },
  {
    key: '04',
    data: {
      id: 18,
      locationId: 18,
      code: '04',
      name: 'Arequipa',
      fullName: 'Arequipa',
      level: 1,
      price: 20,
      deliveryTime: 3,
      deliveryTimeUnit: 'days',
      enabled: true,
      hasRate: true,
      hasChildren: true
    },
    children: [
      {
        key: '0401',
        data: {
          id: 19,
          locationId: 19,
          code: '0401',
          name: 'Arequipa',
          fullName: 'Arequipa / Arequipa',
          level: 2,
          price: 18,
          deliveryTime: 2,
          deliveryTimeUnit: 'days',
          enabled: true,
          hasRate: true,
          hasChildren: false
        }
      }
    ]
  },
  {
    key: '13',
    data: {
      id: 20,
      locationId: 20,
      code: '13',
      name: 'La Libertad',
      fullName: 'La Libertad',
      level: 1,
      price: 18,
      deliveryTime: 2,
      deliveryTimeUnit: 'days',
      enabled: true,
      hasRate: true,
      hasChildren: false
    }
  },
  {
    key: '14',
    data: {
      id: 21,
      locationId: 21,
      code: '14',
      name: 'Lambayeque',
      fullName: 'Lambayeque',
      level: 1,
      price: 18,
      deliveryTime: 2,
      deliveryTimeUnit: 'days',
      enabled: true,
      hasRate: true,
      hasChildren: false
    }
  },
  {
    key: '08',
    data: {
      id: 22,
      locationId: 22,
      code: '08',
      name: 'Cusco',
      fullName: 'Cusco',
      level: 1,
      price: 25,
      deliveryTime: 4,
      deliveryTimeUnit: 'days',
      enabled: true,
      hasRate: true,
      hasChildren: false
    }
  }
]

// Mock data para Ecuador - Vacío (sin tarifas configuradas)
const MOCK_ECUADOR_TREE: RateTreeNode[] = []

// Mock data para Colombia - Vacío (sin tarifas configuradas)
const MOCK_COLOMBIA_TREE: RateTreeNode[] = []

// Simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Contador para IDs mock
let mockIdCounter = 1000

export const shippingApi = {
  /**
   * Obtiene las tarifas de envío de un país en estructura de árbol
   */
  async getRates(countryCode: CountryCode): Promise<ApiResponse<RateTreeNode[]>> {
    if (USE_MOCKS) {
      await delay(300)
      let data: RateTreeNode[] = []
      switch (countryCode) {
        case 'PE':
          data = MOCK_PERU_TREE
          break
        case 'EC':
          data = MOCK_ECUADOR_TREE
          break
        case 'CO':
          data = MOCK_COLOMBIA_TREE
          break
      }
      return { success: true, data }
    }

    const response = await apiClient.get(`/shipping/rates?country=${countryCode}`)
    return response.data
  },

  /**
   * Obtiene ubicaciones por país y código padre (para dropdowns en cascada).
   * Uses real ubigeo API endpoints for all countries.
   * Code format: "codDpto" for level 1, "codDpto-codProv" for level 2,
   * "codDpto-codProv-codDist" for level 3.
   */
  async getLocations(countryCode: CountryCode, parentCode?: string): Promise<ApiResponse<Location[]>> {
    const codPais = COUNTRY_COD_PAIS[countryCode]
    if (!codPais) return { success: true, data: [] }

    try {
      if (!parentCode) {
        // Level 1: departments/regions
        const { data } = await apiClient.get('/ubigeo/regions', { params: { codPais } })
        const items = (data.data || data) as Array<{
          id: number
          name: string
          codDpto: number
        }>
        return {
          success: true,
          data: items.map(r => ({
            id: r.id,
            code: String(r.codDpto),
            name: r.name,
            level: 1 as const,
            countryCode
          }))
        }
      }

      const parts = parentCode.split('-')

      if (parts.length === 1) {
        // Parent is a department → get provinces
        const codDpto = parseInt(parts[0])
        const { data } = await apiClient.get('/ubigeo/provinces', {
          params: { codPais, codDpto }
        })
        const items = (data.data || data) as Array<{
          id: number
          name: string
          codDpto: number
          codProv: number
        }>
        return {
          success: true,
          data: items.map(p => ({
            id: p.id,
            code: `${p.codDpto}-${p.codProv}`,
            name: p.name,
            level: 2 as const,
            parentCode,
            countryCode
          }))
        }
      }

      if (parts.length === 2) {
        // Parent is a province → get districts
        const codDpto = parseInt(parts[0])
        const codProv = parseInt(parts[1])
        const { data } = await apiClient.get('/ubigeo/districts', {
          params: { codPais, codDpto, codProv }
        })
        const items = (data.data || data) as Array<{
          id: number
          name: string
          codDpto: number
          codProv: number
          codDist: number
        }>
        return {
          success: true,
          data: items.map(d => ({
            id: d.id,
            code: `${d.codDpto}-${d.codProv}-${d.codDist}`,
            name: d.name,
            level: 3 as const,
            parentCode,
            countryCode
          }))
        }
      }

      return { success: true, data: [] }
    } catch (err) {
      console.error('Error fetching locations:', err)
      return { success: true, data: [] }
    }
  },

  /**
   * Crea una nueva tarifa de envío
   */
  async createRate(data: SaveShippingRateRequest): Promise<ApiResponse<ShippingRate>> {
    if (USE_MOCKS) {
      await delay(500)
      const newRate: ShippingRate = {
        id: ++mockIdCounter,
        locationId: data.locationId,
        locationCode: data.locationCode,
        locationName: '',
        locationFullName: '',
        level: 1,
        countryCode: data.countryCode,
        price: data.price,
        deliveryTime: data.deliveryTime,
        deliveryTimeUnit: data.deliveryTimeUnit,
        enabled: data.enabled ?? true
      }
      return { success: true, data: newRate, message: 'Tarifa creada exitosamente' }
    }

    const response = await apiClient.post('/shipping/rates', data)
    return response.data
  },

  /**
   * Actualiza una tarifa existente
   */
  async updateRate(id: number, data: UpdateShippingRateRequest): Promise<ApiResponse<ShippingRate>> {
    if (USE_MOCKS) {
      await delay(500)
      // En mocks no actualizamos realmente, solo simulamos éxito
      return {
        success: true,
        message: 'Tarifa actualizada exitosamente',
        data: {
          id,
          locationId: 0,
          locationCode: '',
          locationName: '',
          locationFullName: '',
          level: 1,
          countryCode: 'PE',
          price: data.price ?? 0,
          deliveryTime: data.deliveryTime ?? 0,
          deliveryTimeUnit: data.deliveryTimeUnit ?? 'days',
          enabled: data.enabled ?? true
        }
      }
    }

    const response = await apiClient.put(`/shipping/rates/${id}`, data)
    return response.data
  },

  /**
   * Elimina una tarifa
   */
  async deleteRate(id: number): Promise<ApiResponse<void>> {
    if (USE_MOCKS) {
      await delay(300)
      return { success: true, message: 'Tarifa eliminada exitosamente' }
    }

    const response = await apiClient.delete(`/shipping/rates/${id}`)
    return response.data
  },

  /**
   * Habilita o deshabilita una tarifa
   */
  async toggleRate(id: number, enabled: boolean): Promise<ApiResponse<void>> {
    if (USE_MOCKS) {
      await delay(200)
      return { success: true, message: enabled ? 'Tarifa habilitada' : 'Tarifa deshabilitada' }
    }

    const response = await apiClient.put(`/shipping/rates/${id}/toggle`, { enabled })
    return response.data
  },

  /**
   * Obtiene los países habilitados para envío de la tienda
   */
  async getEnabledCountries(): Promise<ApiResponse<Country[]>> {
    if (USE_MOCKS) {
      await delay(100)
      const enabledCountries = SUPPORTED_COUNTRIES.filter(c =>
        MOCK_STORE_ENABLED_COUNTRIES.includes(c.code)
      )
      return { success: true, data: enabledCountries }
    }

    const response = await apiClient.get('/shipping/countries')
    return response.data
  }
}
