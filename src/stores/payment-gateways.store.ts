import { defineStore } from 'pinia'
import { ref } from 'vue'
import { paymentGatewaysApi } from '@/api/payment-gateways.api'
import type {
  PaymentGateway,
  GatewayConfig,
  SaveGatewayCredentialsRequest,
  TestConnectionResponse
} from '@/types/payment-gateway.types'

export const usePaymentGatewaysStore = defineStore('payment-gateways', () => {
  // State
  const gateways = ref<PaymentGateway[]>([])
  const currentConfig = ref<GatewayConfig | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isTesting = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Actions

  /**
   * Carga la lista de todas las pasarelas
   */
  async function fetchGateways() {
    try {
      isLoading.value = true
      error.value = null

      const response = await paymentGatewaysApi.getGateways()

      if (response.success && response.data) {
        gateways.value = response.data
      } else {
        error.value = response.message || 'Error al cargar pasarelas'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar pasarelas:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Carga la configuración de una pasarela específica
   */
  async function fetchGatewayConfig(code: string) {
    try {
      isLoading.value = true
      error.value = null
      currentConfig.value = null

      const response = await paymentGatewaysApi.getGatewayConfig(code)

      if (response.success && response.data) {
        currentConfig.value = response.data
      } else {
        error.value = response.message || 'Error al cargar configuración'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar configuración:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Guarda las credenciales de una pasarela
   */
  async function saveCredentials(code: string, data: SaveGatewayCredentialsRequest) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null

      const response = await paymentGatewaysApi.saveCredentials(code, data)

      if (response.success) {
        successMessage.value = response.message || 'Credenciales guardadas exitosamente'
        // Refrescar lista
        await fetchGateways()
        return { success: true }
      } else {
        error.value = response.message || 'Error al guardar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al guardar credenciales'
      console.error('Error al guardar credenciales:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Actualiza las credenciales de una pasarela
   */
  async function updateCredentials(code: string, data: SaveGatewayCredentialsRequest) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null

      const response = await paymentGatewaysApi.updateCredentials(code, data)

      if (response.success) {
        successMessage.value = response.message || 'Credenciales actualizadas exitosamente'
        // Refrescar configuración actual
        await fetchGatewayConfig(code)
        return { success: true }
      } else {
        error.value = response.message || 'Error al actualizar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar credenciales'
      console.error('Error al actualizar credenciales:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Elimina las credenciales de una pasarela
   */
  async function deleteCredentials(code: string) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null

      const response = await paymentGatewaysApi.deleteCredentials(code)

      if (response.success) {
        successMessage.value = response.message || 'Configuración eliminada exitosamente'
        currentConfig.value = null
        // Refrescar lista
        await fetchGateways()
        return { success: true }
      } else {
        error.value = response.message || 'Error al eliminar configuración'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar configuración'
      console.error('Error al eliminar configuración:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Prueba la conexión con una pasarela
   */
  async function testConnection(code: string): Promise<{
    success: boolean
    data?: TestConnectionResponse
    error?: string
  }> {
    try {
      isTesting.value = true
      error.value = null

      const response = await paymentGatewaysApi.testConnection(code)

      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        error.value = response.message || 'Error al probar conexión'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al probar conexión'
      console.error('Error al probar conexión:', err)
      return { success: false, error: error.value ?? undefined }
    } finally {
      isTesting.value = false
    }
  }

  /**
   * Activa o desactiva una pasarela
   */
  async function toggleGateway(code: string, enabled: boolean) {
    try {
      error.value = null

      const response = await paymentGatewaysApi.toggleGateway(code, enabled)

      if (response.success) {
        // Actualizar en la lista local
        const gateway = gateways.value.find(g => g.code === code)
        if (gateway) {
          gateway.enabled = enabled
        }
        return { success: true }
      } else {
        error.value = response.message || 'Error al cambiar estado'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cambiar estado'
      console.error('Error al cambiar estado:', err)
      return { success: false, error: error.value }
    }
  }

  /**
   * Limpia los mensajes de error y éxito
   */
  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  /**
   * Obtiene una pasarela por código
   */
  function getGatewayByCode(code: string): PaymentGateway | undefined {
    return gateways.value.find(g => g.code === code)
  }

  return {
    // State
    gateways,
    currentConfig,
    isLoading,
    isSaving,
    isTesting,
    error,
    successMessage,
    // Actions
    fetchGateways,
    fetchGatewayConfig,
    saveCredentials,
    updateCredentials,
    deleteCredentials,
    testConnection,
    toggleGateway,
    clearMessages,
    getGatewayByCode
  }
})
