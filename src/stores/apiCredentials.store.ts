import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiCredentialsApi } from '@/api/api-credentials.api'
import type {
  StoreWebhook,
  SaveWebhooksRequest
} from '@/types/api-credentials.types'

export const useApiCredentialsStore = defineStore('apiCredentials', () => {
  // State
  const token = ref<string | null>(null)
  const tokenCreatedAt = ref<string | null>(null)
  const webhooks = ref<StoreWebhook[]>([])
  const webhookTypes = ref<Array<{ value: number; label: string }>>([])

  const isLoading = ref(false)
  const isCreatingToken = ref(false)
  const isRenewingToken = ref(false)
  const isSavingWebhooks = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Actions - API Credentials

  async function fetchCredentials() {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiCredentialsApi.getCredentials()

      if (response.success && response.data) {
        token.value = response.data.token
        tokenCreatedAt.value = response.data.created_at
      } else {
        token.value = null
        tokenCreatedAt.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar credenciales'
      console.error('Error al cargar credenciales:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createToken(): Promise<{ success: boolean; error?: string }> {
    try {
      isCreatingToken.value = true
      error.value = null
      successMessage.value = null

      const response = await apiCredentialsApi.createToken()

      if (response.success && response.data) {
        token.value = response.data.token
        tokenCreatedAt.value = response.data.created_at
        successMessage.value = 'Token creado exitosamente'
        return { success: true }
      } else {
        error.value = response.message || 'Error al crear token'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear token'
      console.error('Error al crear token:', err)
      return { success: false, error: error.value ?? undefined }
    } finally {
      isCreatingToken.value = false
    }
  }

  async function renewToken(): Promise<{ success: boolean; error?: string }> {
    try {
      isRenewingToken.value = true
      error.value = null
      successMessage.value = null

      const response = await apiCredentialsApi.renewToken()

      if (response.success && response.data) {
        token.value = response.data.token
        tokenCreatedAt.value = response.data.renewed_at
        successMessage.value = 'Token renovado exitosamente'
        return { success: true }
      } else {
        error.value = response.message || 'Error al renovar token'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al renovar token'
      console.error('Error al renovar token:', err)
      return { success: false, error: error.value ?? undefined }
    } finally {
      isRenewingToken.value = false
    }
  }

  async function deleteToken(): Promise<{ success: boolean; error?: string }> {
    try {
      isLoading.value = true
      error.value = null
      successMessage.value = null

      const response = await apiCredentialsApi.deleteToken()

      if (response.success) {
        token.value = null
        tokenCreatedAt.value = null
        successMessage.value = 'Token eliminado exitosamente'
        return { success: true }
      } else {
        error.value = response.message || 'Error al eliminar token'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar token'
      console.error('Error al eliminar token:', err)
      return { success: false, error: error.value ?? undefined }
    } finally {
      isLoading.value = false
    }
  }

  // Actions - Webhooks

  async function fetchWebhooks() {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiCredentialsApi.getWebhooks()

      if (response.success && response.data) {
        webhooks.value = response.data
      } else {
        error.value = 'Error al cargar webhooks'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar webhooks:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchWebhookTypes() {
    try {
      const response = await apiCredentialsApi.getWebhookTypes()

      if (response.success && response.data) {
        webhookTypes.value = response.data
      }
    } catch (err: any) {
      console.error('Error al cargar tipos de webhook:', err)
    }
  }

  async function syncWebhooks(data: SaveWebhooksRequest): Promise<{ success: boolean; error?: string }> {
    try {
      isSavingWebhooks.value = true
      error.value = null
      successMessage.value = null

      const response = await apiCredentialsApi.syncWebhooks(data)

      if (response.success) {
        successMessage.value = 'Webhooks guardados exitosamente'
        // Refresh webhooks list
        await fetchWebhooks()
        return { success: true }
      } else {
        error.value = response.message || 'Error al guardar webhooks'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al guardar webhooks'
      console.error('Error al guardar webhooks:', err)
      return { success: false, error: error.value ?? undefined }
    } finally {
      isSavingWebhooks.value = false
    }
  }

  async function deleteWebhook(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiCredentialsApi.deleteWebhook(id)

      if (response.success) {
        successMessage.value = 'Webhook eliminado exitosamente'
        // Refresh webhooks list
        await fetchWebhooks()
        return { success: true }
      } else {
        error.value = response.message || 'Error al eliminar webhook'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar webhook'
      console.error('Error al eliminar webhook:', err)
      return { success: false, error: error.value ?? undefined }
    } finally {
      isLoading.value = false
    }
  }

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  return {
    // State
    token,
    tokenCreatedAt,
    webhooks,
    webhookTypes,
    isLoading,
    isCreatingToken,
    isRenewingToken,
    isSavingWebhooks,
    error,
    successMessage,
    // Actions
    fetchCredentials,
    createToken,
    renewToken,
    deleteToken,
    fetchWebhooks,
    fetchWebhookTypes,
    syncWebhooks,
    deleteWebhook,
    clearMessages
  }
})
