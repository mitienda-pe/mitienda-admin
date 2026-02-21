import { ref } from 'vue'
import { defineStore } from 'pinia'
import { integrationProvidersApi } from '@/api/integration-providers.api'
import type {
  IntegrationProvider,
  IntegrationProviderConfig,
  SaveIntegrationProviderRequest,
  TestConnectionResult
} from '@/types/integration-provider.types'

export const useIntegrationProvidersStore = defineStore('integration-providers', () => {
  const providers = ref<IntegrationProvider[]>([])
  const currentConfig = ref<IntegrationProviderConfig | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isTesting = ref(false)
  const error = ref<string | null>(null)
  const testResult = ref<TestConnectionResult | null>(null)

  async function fetchProviders() {
    isLoading.value = true
    error.value = null
    try {
      const response = await integrationProvidersApi.getAll()
      if (response.success && response.data) {
        providers.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar proveedores'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchConfig(code: string) {
    isLoading.value = true
    error.value = null
    currentConfig.value = null
    try {
      const response = await integrationProvidersApi.getConfig(code)
      if (response.success && response.data) {
        currentConfig.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar configuración'
    } finally {
      isLoading.value = false
    }
  }

  async function saveConfig(code: string, data: SaveIntegrationProviderRequest): Promise<boolean> {
    isSaving.value = true
    try {
      const response = await integrationProvidersApi.saveConfig(code, data)
      if (response.success) {
        await fetchConfig(code)
        await fetchProviders()
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al guardar'
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function updateConfig(
    code: string,
    data: SaveIntegrationProviderRequest
  ): Promise<boolean> {
    isSaving.value = true
    try {
      const response = await integrationProvidersApi.updateConfig(code, data)
      if (response.success) {
        await fetchConfig(code)
        await fetchProviders()
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al actualizar'
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function deleteConfig(code: string): Promise<boolean> {
    isSaving.value = true
    try {
      const response = await integrationProvidersApi.deleteConfig(code)
      if (response.success) {
        currentConfig.value = null
        await fetchProviders()
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al eliminar'
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function testConnection(code: string): Promise<TestConnectionResult | null> {
    isTesting.value = true
    testResult.value = null
    try {
      const response = await integrationProvidersApi.testConnection(code)
      if (response.success && response.data) {
        testResult.value = response.data
        return response.data
      }
      return null
    } catch (err: any) {
      testResult.value = {
        success: false,
        message: err.response?.data?.messages?.error || 'Error al probar conexión'
      }
      return testResult.value
    } finally {
      isTesting.value = false
    }
  }

  async function toggleProvider(code: string): Promise<boolean> {
    isSaving.value = true
    try {
      const response = await integrationProvidersApi.toggleProvider(code)
      if (response.success) {
        await fetchProviders()
        if (currentConfig.value?.provider?.code === code) {
          await fetchConfig(code)
        }
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cambiar estado'
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    providers,
    currentConfig,
    isLoading,
    isSaving,
    isTesting,
    error,
    testResult,
    fetchProviders,
    fetchConfig,
    saveConfig,
    updateConfig,
    deleteConfig,
    testConnection,
    toggleProvider
  }
})
