import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  PaymentGateway,
  GatewayConfig,
  SaveGatewayCredentialsRequest,
  TestConnectionResponse
} from '@/types/payment-gateway.types'

// Flag para usar mocks mientras el backend no esté listo
const USE_MOCKS = true

// Mock data para desarrollo
const MOCK_GATEWAYS: PaymentGateway[] = [
  {
    id: 1,
    code: 'izipay',
    name: 'Izipay',
    logo: 'izipay.png',
    description: 'Pasarela de pagos con múltiples métodos: tarjeta, Yape, Banca Móvil y más.',
    configured: true,
    enabled: true,
    environment: 'produccion'
  },
  {
    id: 2,
    code: 'niubiz',
    name: 'Niubiz',
    logo: 'niubiz.png',
    description: 'Solución de pagos del BBVA para comercios en Perú.',
    configured: true,
    enabled: true,
    environment: 'integracion'
  },
  {
    id: 3,
    code: 'culqi',
    name: 'Culqi',
    logo: 'culqi.png',
    description: 'Plataforma de pagos online con soporte para múltiples métodos.',
    configured: true,
    enabled: false,
    environment: 'prueba'
  },
  {
    id: 4,
    code: 'mercadopago',
    name: 'Mercado Pago',
    logo: 'mercadopago.png',
    description: 'Solución de pagos de Mercado Libre con financiamiento.',
    configured: false,
    enabled: false
  },
  {
    id: 5,
    code: 'openpay',
    name: 'Openpay',
    logo: 'openpay.png',
    description: 'Pasarela de pagos con soporte para cuotas.',
    configured: false,
    enabled: false
  },
  {
    id: 6,
    code: 'powerpay',
    name: 'Powerpay',
    logo: 'powerpay.png',
    description: 'Solución de pagos Buy Now Pay Later (BNPL).',
    configured: false,
    enabled: false
  },
  {
    id: 7,
    code: 'paypal',
    name: 'PayPal',
    logo: 'paypal.png',
    description: 'Pagos internacionales con PayPal.',
    configured: false,
    enabled: false
  },
  {
    id: 8,
    code: 'qr-wallets',
    name: 'Billeteras QR',
    logo: 'qr-wallets.png',
    description: 'Yape y Plin - Pagos con código QR.',
    configured: false,
    enabled: false
  },
  {
    id: 9,
    code: 'bank-transfer',
    name: 'Transferencia Bancaria',
    logo: 'bank-transfer.png',
    description: 'Depósito o transferencia a cuenta bancaria.',
    configured: true,
    enabled: true,
    environment: 'produccion'
  },
  {
    id: 10,
    code: 'cash-on-delivery',
    name: 'Contra Entrega',
    logo: 'cash-on-delivery.png',
    description: 'Pago en efectivo al momento de la entrega.',
    configured: false,
    enabled: false
  }
]

// Simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const paymentGatewaysApi = {
  /**
   * Obtiene lista de todas las pasarelas con su estado
   */
  async getGateways(): Promise<ApiResponse<PaymentGateway[]>> {
    if (USE_MOCKS) {
      await delay(300)
      return {
        success: true,
        data: MOCK_GATEWAYS
      }
    }

    const response = await apiClient.get('/payment-gateways')
    return response.data
  },

  /**
   * Obtiene la configuración de una pasarela específica
   */
  async getGatewayConfig(code: string): Promise<ApiResponse<GatewayConfig>> {
    if (USE_MOCKS) {
      await delay(200)
      const gateway = MOCK_GATEWAYS.find(g => g.code === code)
      if (!gateway) {
        return {
          success: false,
          message: 'Pasarela no encontrada'
        }
      }
      return {
        success: true,
        data: {
          gateway,
          credentials: null
        }
      }
    }

    const response = await apiClient.get(`/payment-gateways/${code}`)
    return response.data
  },

  /**
   * Guarda las credenciales de una pasarela (crear)
   */
  async saveCredentials(
    code: string,
    data: SaveGatewayCredentialsRequest
  ): Promise<ApiResponse<void>> {
    if (USE_MOCKS) {
      await delay(500)
      // Actualizar mock
      const gateway = MOCK_GATEWAYS.find(g => g.code === code)
      if (gateway) {
        gateway.configured = true
        gateway.enabled = data.enabled ?? true
        gateway.environment = data.environment
      }
      return {
        success: true,
        message: 'Credenciales guardadas exitosamente'
      }
    }

    const response = await apiClient.post(`/payment-gateways/${code}`, data)
    return response.data
  },

  /**
   * Actualiza las credenciales de una pasarela existente
   */
  async updateCredentials(
    code: string,
    data: SaveGatewayCredentialsRequest
  ): Promise<ApiResponse<void>> {
    if (USE_MOCKS) {
      await delay(500)
      const gateway = MOCK_GATEWAYS.find(g => g.code === code)
      if (gateway) {
        gateway.environment = data.environment
        if (data.enabled !== undefined) {
          gateway.enabled = data.enabled
        }
      }
      return {
        success: true,
        message: 'Credenciales actualizadas exitosamente'
      }
    }

    const response = await apiClient.put(`/payment-gateways/${code}`, data)
    return response.data
  },

  /**
   * Elimina la configuración de una pasarela
   */
  async deleteCredentials(code: string): Promise<ApiResponse<void>> {
    if (USE_MOCKS) {
      await delay(300)
      const gateway = MOCK_GATEWAYS.find(g => g.code === code)
      if (gateway) {
        gateway.configured = false
        gateway.enabled = false
        gateway.environment = undefined
      }
      return {
        success: true,
        message: 'Configuración eliminada exitosamente'
      }
    }

    const response = await apiClient.delete(`/payment-gateways/${code}`)
    return response.data
  },

  /**
   * Prueba la conexión con una pasarela
   */
  async testConnection(code: string): Promise<ApiResponse<TestConnectionResponse>> {
    if (USE_MOCKS) {
      await delay(1000)
      const gateway = MOCK_GATEWAYS.find(g => g.code === code)
      return {
        success: true,
        data: {
          connected: true,
          environment: gateway?.environment || 'prueba',
          message: 'Conexión exitosa (mock)'
        }
      }
    }

    const response = await apiClient.post(`/payment-gateways/${code}/test`)
    return response.data
  },

  /**
   * Activa o desactiva una pasarela
   */
  async toggleGateway(code: string, enabled: boolean): Promise<ApiResponse<void>> {
    if (USE_MOCKS) {
      await delay(200)
      const gateway = MOCK_GATEWAYS.find(g => g.code === code)
      if (gateway) {
        gateway.enabled = enabled
      }
      return {
        success: true,
        message: enabled ? 'Pasarela activada' : 'Pasarela desactivada'
      }
    }

    const response = await apiClient.put(`/payment-gateways/${code}/toggle`, { enabled })
    return response.data
  }
}
