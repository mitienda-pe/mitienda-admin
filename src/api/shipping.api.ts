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

// Mock ubicaciones para dropdown de agregar (Perú - Departamentos)
const MOCK_PERU_DEPARTMENTS: Location[] = [
  { id: 1, code: '01', name: 'Amazonas', level: 1, countryCode: 'PE' },
  { id: 2, code: '02', name: 'Áncash', level: 1, countryCode: 'PE' },
  { id: 3, code: '03', name: 'Apurímac', level: 1, countryCode: 'PE' },
  { id: 4, code: '04', name: 'Arequipa', level: 1, countryCode: 'PE' },
  { id: 5, code: '05', name: 'Ayacucho', level: 1, countryCode: 'PE' },
  { id: 6, code: '06', name: 'Cajamarca', level: 1, countryCode: 'PE' },
  { id: 7, code: '07', name: 'Callao', level: 1, countryCode: 'PE' },
  { id: 8, code: '08', name: 'Cusco', level: 1, countryCode: 'PE' },
  { id: 9, code: '09', name: 'Huancavelica', level: 1, countryCode: 'PE' },
  { id: 10, code: '10', name: 'Huánuco', level: 1, countryCode: 'PE' },
  { id: 11, code: '11', name: 'Ica', level: 1, countryCode: 'PE' },
  { id: 12, code: '12', name: 'Junín', level: 1, countryCode: 'PE' },
  { id: 13, code: '13', name: 'La Libertad', level: 1, countryCode: 'PE' },
  { id: 14, code: '14', name: 'Lambayeque', level: 1, countryCode: 'PE' },
  { id: 15, code: '15', name: 'Lima', level: 1, countryCode: 'PE' },
  { id: 16, code: '16', name: 'Loreto', level: 1, countryCode: 'PE' },
  { id: 17, code: '17', name: 'Madre de Dios', level: 1, countryCode: 'PE' },
  { id: 18, code: '18', name: 'Moquegua', level: 1, countryCode: 'PE' },
  { id: 19, code: '19', name: 'Pasco', level: 1, countryCode: 'PE' },
  { id: 20, code: '20', name: 'Piura', level: 1, countryCode: 'PE' },
  { id: 21, code: '21', name: 'Puno', level: 1, countryCode: 'PE' },
  { id: 22, code: '22', name: 'San Martín', level: 1, countryCode: 'PE' },
  { id: 23, code: '23', name: 'Tacna', level: 1, countryCode: 'PE' },
  { id: 24, code: '24', name: 'Tumbes', level: 1, countryCode: 'PE' },
  { id: 25, code: '25', name: 'Ucayali', level: 1, countryCode: 'PE' }
]

// Mock provincias de Lima
const MOCK_LIMA_PROVINCES: Location[] = [
  { id: 100, code: '1501', name: 'Lima', level: 2, parentCode: '15', countryCode: 'PE' },
  { id: 101, code: '1502', name: 'Barranca', level: 2, parentCode: '15', countryCode: 'PE' },
  { id: 102, code: '1503', name: 'Cajatambo', level: 2, parentCode: '15', countryCode: 'PE' },
  { id: 103, code: '1504', name: 'Canta', level: 2, parentCode: '15', countryCode: 'PE' },
  { id: 104, code: '1505', name: 'Cañete', level: 2, parentCode: '15', countryCode: 'PE' },
  { id: 105, code: '1506', name: 'Huaral', level: 2, parentCode: '15', countryCode: 'PE' },
  { id: 106, code: '1507', name: 'Huarochirí', level: 2, parentCode: '15', countryCode: 'PE' },
  { id: 107, code: '1508', name: 'Huaura', level: 2, parentCode: '15', countryCode: 'PE' },
  { id: 108, code: '1509', name: 'Oyón', level: 2, parentCode: '15', countryCode: 'PE' },
  { id: 109, code: '1510', name: 'Yauyos', level: 2, parentCode: '15', countryCode: 'PE' }
]

// Mock distritos de Lima provincia
const MOCK_LIMA_DISTRICTS: Location[] = [
  { id: 200, code: '150101', name: 'Lima', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 201, code: '150102', name: 'Ancón', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 202, code: '150103', name: 'Ate', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 203, code: '150104', name: 'Barranco', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 204, code: '150105', name: 'Breña', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 205, code: '150106', name: 'Carabayllo', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 206, code: '150107', name: 'Chaclacayo', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 207, code: '150108', name: 'Chorrillos', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 208, code: '150109', name: 'Cieneguilla', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 209, code: '150110', name: 'Comas', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 210, code: '150111', name: 'El Agustino', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 211, code: '150112', name: 'Independencia', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 212, code: '150113', name: 'Jesús María', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 213, code: '150114', name: 'La Molina', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 214, code: '150115', name: 'La Victoria', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 215, code: '150116', name: 'Lince', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 216, code: '150117', name: 'Los Olivos', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 217, code: '150118', name: 'Lurigancho', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 218, code: '150119', name: 'Lurín', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 219, code: '150120', name: 'Magdalena del Mar', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 220, code: '150121', name: 'Miraflores', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 221, code: '150122', name: 'Pachacámac', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 222, code: '150123', name: 'Pucusana', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 223, code: '150124', name: 'Pueblo Libre', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 224, code: '150125', name: 'Puente Piedra', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 225, code: '150126', name: 'Punta Hermosa', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 226, code: '150127', name: 'Punta Negra', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 227, code: '150128', name: 'Rímac', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 228, code: '150129', name: 'San Bartolo', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 229, code: '150130', name: 'San Borja', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 230, code: '150131', name: 'San Isidro', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 231, code: '150132', name: 'San Juan de Lurigancho', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 232, code: '150133', name: 'San Juan de Miraflores', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 233, code: '150134', name: 'San Luis', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 234, code: '150135', name: 'San Martín de Porres', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 235, code: '150136', name: 'San Miguel', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 236, code: '150137', name: 'Santa Anita', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 237, code: '150138', name: 'Santa María del Mar', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 238, code: '150139', name: 'Santa Rosa', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 239, code: '150140', name: 'Santiago de Surco', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 240, code: '150141', name: 'Surquillo', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 241, code: '150142', name: 'Villa El Salvador', level: 3, parentCode: '1501', countryCode: 'PE' },
  { id: 242, code: '150143', name: 'Villa María del Triunfo', level: 3, parentCode: '1501', countryCode: 'PE' }
]

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
   * Obtiene ubicaciones por país y código padre (para dropdowns en cascada)
   */
  async getLocations(countryCode: CountryCode, parentCode?: string): Promise<ApiResponse<Location[]>> {
    if (USE_MOCKS) {
      await delay(200)

      if (countryCode === 'PE') {
        if (!parentCode) {
          return { success: true, data: MOCK_PERU_DEPARTMENTS }
        }
        if (parentCode === '15') {
          return { success: true, data: MOCK_LIMA_PROVINCES }
        }
        if (parentCode === '1501') {
          return { success: true, data: MOCK_LIMA_DISTRICTS }
        }
        // Otras provincias/distritos - retornar vacío por ahora
        return { success: true, data: [] }
      }

      // Para otros países retornar vacío por ahora
      return { success: true, data: [] }
    }

    const params = new URLSearchParams({ country: countryCode })
    if (parentCode) {
      params.append('parentCode', parentCode)
    }
    const response = await apiClient.get(`/shipping/locations?${params}`)
    return response.data
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
