import { defineStore } from 'pinia'
import { ref } from 'vue'
import { billingApi } from '@/api/billing.api'
import type {
  NubefactConfigResponse,
  SaveNubefactCredentialsRequest,
  TestConnectionResponse
} from '@/types/billing.types'

export const useBillingStore = defineStore('billing', () => {
  // State
  const nubefactConfig = ref<NubefactConfigResponse | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isTesting = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Actions for Nubefact
  async function fetchNubefactConfig() {
    try {
      isLoading.value = true
      error.value = null

      const response = await billingApi.getNubefactConfig()

      if (response.success && response.data) {
        nubefactConfig.value = response.data
      } else {
        error.value = 'Error al cargar configuración de Nubefact'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar configuración de Nubefact:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function saveNubefactCredentials(data: SaveNubefactCredentialsRequest) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null

      const response = await billingApi.saveNubefactCredentials(data)

      if (response.success) {
        successMessage.value = 'Credenciales guardadas exitosamente'
        // Refresh config
        await fetchNubefactConfig()
        return { success: true }
      } else {
        error.value = response.message || 'Error al guardar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al guardar credenciales'
      console.error('Error al guardar credenciales de Nubefact:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function updateNubefactCredentials(data: SaveNubefactCredentialsRequest) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null

      const response = await billingApi.updateNubefactCredentials(data)

      if (response.success) {
        successMessage.value = 'Credenciales actualizadas exitosamente'
        // Refresh config
        await fetchNubefactConfig()
        return { success: true }
      } else {
        error.value = response.message || 'Error al actualizar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar credenciales'
      console.error('Error al actualizar credenciales de Nubefact:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteNubefactCredentials() {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null

      const response = await billingApi.deleteNubefactCredentials()

      if (response.success) {
        successMessage.value = 'Credenciales eliminadas exitosamente'
        nubefactConfig.value = null
        return { success: true }
      } else {
        error.value = response.message || 'Error al eliminar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar credenciales'
      console.error('Error al eliminar credenciales de Nubefact:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function testNubefactConnection(): Promise<{ success: boolean; data?: TestConnectionResponse; error?: string }> {
    try {
      isTesting.value = true
      error.value = null

      const response = await billingApi.testNubefactConnection()

      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        error.value = response.message || 'Error al probar conexión'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al probar conexión'
      console.error('Error al probar conexión de Nubefact:', err)
      return { success: false, error: error.value }
    } finally {
      isTesting.value = false
    }
  }

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  return {
    // State
    nubefactConfig,
    isLoading,
    isSaving,
    isTesting,
    error,
    successMessage,
    // Actions
    fetchNubefactConfig,
    saveNubefactCredentials,
    updateNubefactCredentials,
    deleteNubefactCredentials,
    testNubefactConnection,
    clearMessages
  }
})
