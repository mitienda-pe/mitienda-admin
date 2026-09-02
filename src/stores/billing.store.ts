import { defineStore } from 'pinia'
import { ref } from 'vue'
import { billingApi } from '@/api/billing.api'
import type {
  NubefactConfigResponse,
  SaveNubefactCredentialsRequest,
  TestConnectionResponse,
  BizlinksConfigResponse,
  SaveBizlinksCredentialsRequest
} from '@/types/billing.types'

export const useBillingStore = defineStore('billing', () => {
  // State
  const nubefactConfig = ref<NubefactConfigResponse | null>(null)
  const bizlinksConfig = ref<BizlinksConfigResponse | null>(null)
  const datilConfig = ref<any>(null)
  const sunatConfig = ref<any>(null)
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
      console.error('Response data:', err.response?.data)
      return { success: false, error: error.value ?? undefined }
    } finally {
      isTesting.value = false
    }
  }

  // Actions for Bizlinks (Peru)
  async function fetchBizlinksConfig() {
    try {
      isLoading.value = true
      error.value = null
      const response = await billingApi.getBizlinksConfig()
      if (response.success && response.data) {
        bizlinksConfig.value = response.data
      } else {
        error.value = 'Error al cargar configuración de Bizlinks'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar configuración de Bizlinks:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function saveBizlinksCredentials(data: SaveBizlinksCredentialsRequest) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null
      const response = await billingApi.saveBizlinksCredentials(data)
      if (response.success) {
        successMessage.value = 'Credenciales de Bizlinks guardadas exitosamente'
        await fetchBizlinksConfig()
        return { success: true }
      } else {
        error.value = response.message || 'Error al guardar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al guardar credenciales'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function updateBizlinksCredentials(data: SaveBizlinksCredentialsRequest) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null
      const response = await billingApi.updateBizlinksCredentials(data)
      if (response.success) {
        successMessage.value = 'Credenciales de Bizlinks actualizadas exitosamente'
        await fetchBizlinksConfig()
        return { success: true }
      } else {
        error.value = response.message || 'Error al actualizar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar credenciales'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteBizlinksCredentials() {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null
      const response = await billingApi.deleteBizlinksCredentials()
      if (response.success) {
        successMessage.value = 'Credenciales de Bizlinks eliminadas exitosamente'
        bizlinksConfig.value = null
        return { success: true }
      } else {
        error.value = response.message || 'Error al eliminar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar credenciales'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function testBizlinksConnection(): Promise<{ success: boolean; data?: TestConnectionResponse; error?: string }> {
    try {
      isTesting.value = true
      error.value = null
      const response = await billingApi.testBizlinksConnection()
      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        error.value = response.message || 'Error al probar conexión'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al probar conexión'
      return { success: false, error: error.value ?? undefined }
    } finally {
      isTesting.value = false
    }
  }

  // Actions for Dátil (Ecuador)
  async function fetchDatilConfig() {
    try {
      isLoading.value = true
      error.value = null
      const response = await billingApi.getDatilConfig()
      if (response.success && response.data) {
        datilConfig.value = response.data
      } else {
        error.value = 'Error al cargar configuración de Dátil'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
    } finally {
      isLoading.value = false
    }
  }

  async function saveDatilCredentials(data: any) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null
      const response = await billingApi.saveDatilCredentials(data)
      if (response.success) {
        successMessage.value = 'Credenciales de Dátil guardadas exitosamente'
        await fetchDatilConfig()
        return { success: true }
      } else {
        error.value = response.message || 'Error al guardar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al guardar credenciales'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function updateDatilCredentials(data: any) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null
      const response = await billingApi.updateDatilCredentials(data)
      if (response.success) {
        successMessage.value = 'Credenciales de Dátil actualizadas exitosamente'
        await fetchDatilConfig()
        return { success: true }
      } else {
        error.value = response.message || 'Error al actualizar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar credenciales'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteDatilCredentials() {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null
      const response = await billingApi.deleteDatilCredentials()
      if (response.success) {
        successMessage.value = 'Credenciales de Dátil eliminadas exitosamente'
        datilConfig.value = null
        return { success: true }
      } else {
        error.value = response.message || 'Error al eliminar credenciales'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar credenciales'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function testDatilConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      isTesting.value = true
      error.value = null
      const response = await billingApi.testDatilConnection()
      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        error.value = response.message || 'Error al probar conexión'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al probar conexión'
      return { success: false, error: error.value ?? undefined }
    } finally {
      isTesting.value = false
    }
  }

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }


  // Actions para Facturación MiTienda (SEE propio, sin PSE)
  async function fetchSunatConfig() {
    try {
      isLoading.value = true
      error.value = null
      const response = await billingApi.getSunatConfig()
      if (response.success && response.data) {
        sunatConfig.value = response.data
      } else {
        error.value = 'Error al cargar la configuración de Facturación MiTienda'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Alta o actualización de la empresa emisora. Es idempotente en el backend, así
   * que sirve igual para el alta inicial y para renovar el certificado cuando
   * venza el CDT (que dura un año).
   */
  async function saveSunatCompany(data: any, isUpdate = false) {
    try {
      isSaving.value = true
      error.value = null
      successMessage.value = null
      const response = isUpdate
        ? await billingApi.updateSunatCompany(data)
        : await billingApi.saveSunatCompany(data)
      if (response.success) {
        successMessage.value = 'Facturación MiTienda configurada correctamente'
        await fetchSunatConfig()
        return { success: true }
      }
      error.value = response.message || 'No se pudo guardar la configuración'
      return { success: false, error: error.value }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'No se pudo guardar la configuración'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteSunatConfig() {
    try {
      isSaving.value = true
      error.value = null
      const response = await billingApi.deleteSunatConfig()
      if (response.success) {
        sunatConfig.value = null
        successMessage.value = 'Configuración eliminada'
        return { success: true }
      }
      error.value = response.message || 'No se pudo eliminar la configuración'
      return { success: false, error: error.value }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'No se pudo eliminar la configuración'
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function testSunatConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      isTesting.value = true
      error.value = null
      const response = await billingApi.testSunatConnection()
      if (response.success && response.data) {
        return { success: true, data: response.data }
      }
      error.value = response.message || 'No se pudo probar la conexión'
      return { success: false, error: error.value ?? undefined }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'No se pudo probar la conexión'
      return { success: false, error: error.value ?? undefined }
    } finally {
      isTesting.value = false
    }
  }

  /** Valida el certificado sin guardarlo. Devuelve titular y vigencia. */
  async function inspectSunatCertificate(certificado: string, certPassword?: string) {
    try {
      error.value = null
      const response = await billingApi.inspectSunatCertificate(certificado, certPassword)
      if (response.success && response.data) {
        return { success: true, data: response.data }
      }
      error.value = response.message || 'No se pudo leer el certificado'
      return { success: false, error: error.value }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'No se pudo leer el certificado'
      return { success: false, error: error.value }
    }
  }

  return {
    // State
    nubefactConfig,
    bizlinksConfig,
    datilConfig,
    sunatConfig,
    isLoading,
    isSaving,
    isTesting,
    error,
    successMessage,
    // Actions - Nubefact
    fetchNubefactConfig,
    saveNubefactCredentials,
    updateNubefactCredentials,
    deleteNubefactCredentials,
    testNubefactConnection,
    // Actions - Bizlinks
    fetchBizlinksConfig,
    saveBizlinksCredentials,
    updateBizlinksCredentials,
    deleteBizlinksCredentials,
    testBizlinksConnection,
    // Actions - Dátil
    fetchDatilConfig,
    saveDatilCredentials,
    updateDatilCredentials,
    deleteDatilCredentials,
    testDatilConnection,
    fetchSunatConfig,
    saveSunatCompany,
    deleteSunatConfig,
    testSunatConnection,
    inspectSunatCertificate,
    clearMessages
  }
})
