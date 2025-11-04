import { ref } from 'vue'
import { netsuiteApi } from '@/api/netsuite.api'
import type {
  NetsuiteCredential,
  SaveNetsuiteCredentialsRequest,
  NetsuiteSerie,
  SaveNetsuiteSerieRequest,
  TestNetsuiteConnectionResponse
} from '@/types/netsuite.types'

export function useNetsuite() {
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isTesting = ref(false)
  const error = ref<string | null>(null)
  const credentials = ref<NetsuiteCredential | null>(null)
  const series = ref<NetsuiteSerie[]>([])

  /**
   * Get credentials for a store
   */
  const getCredentials = async (tiendaId: number): Promise<NetsuiteCredential | null> => {
    isLoading.value = true
    error.value = null

    console.log('[useNetsuite] getCredentials - tiendaId:', tiendaId)

    try {
      const response = await netsuiteApi.getCredentials(tiendaId)

      console.log('[useNetsuite] getCredentials - response:', {
        success: response.success,
        data: response.data,
        message: response.message
      })

      if (response.success && response.data) {
        credentials.value = response.data
        console.log('[useNetsuite] getCredentials - credentials.value:', credentials.value)
        console.log('[useNetsuite] getCredentials - estado:', credentials.value.tiendacredencialerp_estado)
        console.log('[useNetsuite] getCredentials - autosync:', credentials.value.tiendacredencialerp_autosync_enabled)
        return response.data
      } else {
        error.value = response.message || ''
        console.log('[useNetsuite] getCredentials - error:', error.value)
        return null
      }
    } catch (err: any) {
      error.value = err.message || 'Error al obtener credenciales'
      console.error('[useNetsuite] getCredentials - exception:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Save or update credentials
   */
  const saveCredentials = async (
    data: SaveNetsuiteCredentialsRequest
  ): Promise<{ success: boolean; id?: number; error?: string }> => {
    isSaving.value = true
    error.value = null

    console.log('[useNetsuite] saveCredentials - payload:', {
      tienda_id: data.tienda_id,
      account_id: data.account_id,
      estado: data.estado,
      autosync_enabled: data.autosync_enabled,
      has_consumer_secret: !!data.consumer_secret,
      has_token_secret: !!data.token_secret
    })

    try {
      const response = await netsuiteApi.saveCredentials(data)

      console.log('[useNetsuite] saveCredentials - response:', {
        success: response.success,
        id: response.data?.id,
        message: response.message
      })

      if (response.success) {
        // Reload credentials after save
        if (data.tienda_id) {
          console.log('[useNetsuite] saveCredentials - reloading credentials...')
          await getCredentials(data.tienda_id)
        }
        return { success: true, id: response.data?.id }
      } else {
        error.value = response.message || ''
        console.log('[useNetsuite] saveCredentials - error:', error.value)
        return { success: false, error: error.value || undefined }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al guardar credenciales'
      console.error('[useNetsuite] saveCredentials - exception:', err)
      return { success: false, error: error.value || undefined }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Test connection with NetSuite
   */
  const testConnection = async (
    tiendaId: number
  ): Promise<{ success: boolean; data?: TestNetsuiteConnectionResponse; error?: string }> => {
    isTesting.value = true
    error.value = null

    console.log('[useNetsuite] testConnection - tiendaId:', tiendaId)

    try {
      const response = await netsuiteApi.testConnection(tiendaId)

      console.log('[useNetsuite] testConnection - response:', response)

      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        error.value = response.message || ''
        console.log('[useNetsuite] testConnection - error from API:', error.value)
        return { success: false, error: error.value || undefined }
      }
    } catch (err: any) {
      // Extraer mensaje de error del backend
      const responseData = err.response?.data
      const backendMessage = responseData?.message || responseData?.error
      const validationMessages = responseData?.messages

      // Si hay mensajes de validación, extraer el primero
      let errorMessage = backendMessage || err.message || 'Error al probar conexión'
      if (validationMessages && typeof validationMessages === 'object') {
        const firstKey = Object.keys(validationMessages)[0]
        if (firstKey && validationMessages[firstKey]) {
          const rawMessage = Array.isArray(validationMessages[firstKey])
            ? validationMessages[firstKey][0]
            : validationMessages[firstKey]

          // Si el error menciona 401 Unauthorized de NetSuite, dar un mensaje más amigable
          if (rawMessage.includes('401 Unauthorized') && rawMessage.includes('netsuite.com')) {
            errorMessage = 'Las credenciales de NetSuite son inválidas. Verifica que el Consumer Key, Consumer Secret, Token ID y Token Secret sean correctos y tengan los permisos necesarios en NetSuite.'
          } else if (rawMessage.includes('Credenciales incompletas')) {
            errorMessage = 'Credenciales incompletas. Debes proporcionar Consumer Secret y Token Secret para probar la conexión.'
          } else {
            errorMessage = rawMessage
          }
        }
      }

      error.value = errorMessage

      console.error('[useNetsuite] testConnection - exception:')
      console.error('  Status:', err.response?.status)
      console.error('  Status Text:', err.response?.statusText)
      console.error('  Backend Message:', backendMessage)
      console.error('  Validation Messages:', validationMessages)
      console.error('  Final Error Message:', errorMessage)
      console.error('  Full Response Data:', err.response?.data)

      return { success: false, error: error.value || undefined }
    } finally {
      isTesting.value = false
    }
  }

  /**
   * Delete credentials
   */
  const deleteCredentials = async (id: number): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true
    error.value = null

    try {
      const response = await netsuiteApi.deleteCredentials(id)

      if (response.success) {
        credentials.value = null
        return { success: true }
      } else {
        error.value = response.message || ''
        return { success: false, error: error.value || undefined }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar credenciales'
      return { success: false, error: error.value || undefined }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Get series for a store
   */
  const getSeries = async (tiendaId: number): Promise<NetsuiteSerie[]> => {
    isLoading.value = true
    error.value = null

    console.log('[useNetsuite] getSeries - tiendaId:', tiendaId)

    try {
      const response = await netsuiteApi.getSeries(tiendaId)

      console.log('[useNetsuite] getSeries - response:', {
        success: response.success,
        dataLength: response.data?.length,
        data: response.data
      })

      if (response.success && response.data) {
        series.value = response.data
        return response.data
      } else {
        error.value = response.message || 'Error al obtener series'
        console.log('[useNetsuite] getSeries - error:', error.value)
        return []
      }
    } catch (err: any) {
      error.value = err.message || 'Error al obtener series'
      console.error('[useNetsuite] getSeries - exception:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Save or update a serie mapping
   */
  const saveSerie = async (
    tiendaId: number,
    data: SaveNetsuiteSerieRequest
  ): Promise<{ success: boolean; id?: number; error?: string }> => {
    isSaving.value = true
    error.value = null

    try {
      const response = await netsuiteApi.saveSerie(tiendaId, data)

      if (response.success) {
        // Reload series after save
        await getSeries(tiendaId)
        return { success: true, id: response.data?.id }
      } else {
        error.value = response.message || ''
        return { success: false, error: error.value || undefined }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al guardar serie'
      return { success: false, error: error.value || undefined }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Get unmapped series
   */
  const getUnmappedSeries = async (tiendaId: number): Promise<NetsuiteSerie[]> => {
    isLoading.value = true
    error.value = null

    console.log('[useNetsuite] getUnmappedSeries - tiendaId:', tiendaId)

    try {
      const response = await netsuiteApi.getUnmappedSeries(tiendaId)

      console.log('[useNetsuite] getUnmappedSeries - response:', {
        success: response.success,
        dataLength: response.data?.length,
        data: response.data
      })

      if (response.success && response.data) {
        return response.data
      } else {
        error.value = response.message || 'Error al obtener series sin mapear'
        console.log('[useNetsuite] getUnmappedSeries - error:', error.value)
        return []
      }
    } catch (err: any) {
      error.value = err.message || 'Error al obtener series sin mapear'
      console.error('[useNetsuite] getUnmappedSeries - exception:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    isLoading,
    isSaving,
    isTesting,
    error,
    credentials,
    series,

    // Methods
    getCredentials,
    saveCredentials,
    testConnection,
    deleteCredentials,
    getSeries,
    saveSerie,
    getUnmappedSeries,
    clearError
  }
}
