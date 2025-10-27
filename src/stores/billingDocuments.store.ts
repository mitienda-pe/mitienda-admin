import { defineStore } from 'pinia'
import { ref } from 'vue'
import { billingApi } from '@/api/billing.api'
import type {
  BillingDocument,
  BillingDocumentDetail,
  EmitDocumentRequest
} from '@/types/billing.types'

export const useBillingDocumentsStore = defineStore('billingDocuments', () => {
  // State
  const documents = ref<BillingDocument[]>([])
  const currentDocument = ref<BillingDocumentDetail | null>(null)
  const isLoading = ref(false)
  const isEmitting = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    limit: 20,
    offset: 0
  })

  // Actions
  async function fetchDocuments(limit = 20, offset = 0) {
    try {
      isLoading.value = true
      error.value = null

      const response = await billingApi.getDocuments(limit, offset)

      if (response.success && response.data) {
        documents.value = response.data.data
        pagination.value = response.data.pagination
      } else {
        error.value = 'Error al cargar documentos'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar documentos:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDocumentDetail(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await billingApi.getDocumentDetail(id)

      if (response.success && response.data) {
        currentDocument.value = response.data
      } else {
        error.value = 'Error al cargar detalle del documento'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar detalle del documento:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function emitDocument(data: EmitDocumentRequest): Promise<{ success: boolean; error?: string }> {
    try {
      isEmitting.value = true
      error.value = null
      successMessage.value = null

      const response = await billingApi.emitDocument(data)

      if (response.success) {
        successMessage.value = 'Comprobante emitido exitosamente'
        // Refresh documents list
        await fetchDocuments(pagination.value.limit, pagination.value.offset)
        return { success: true }
      } else {
        error.value = response.message || 'Error al emitir comprobante'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al emitir comprobante'
      console.error('Error al emitir comprobante:', err)
      return { success: false, error: error.value }
    } finally {
      isEmitting.value = false
    }
  }

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  function clearCurrentDocument() {
    currentDocument.value = null
  }

  return {
    // State
    documents,
    currentDocument,
    isLoading,
    isEmitting,
    error,
    successMessage,
    pagination,
    // Actions
    fetchDocuments,
    fetchDocumentDetail,
    emitDocument,
    clearMessages,
    clearCurrentDocument
  }
})
