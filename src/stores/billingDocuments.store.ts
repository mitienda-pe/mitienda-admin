import { defineStore } from 'pinia'
import { ref } from 'vue'
import { billingApi } from '@/api/billing.api'
import type {
  BillingDocument,
  BillingDocumentDetail,
  BillingDocumentFilters,
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
  const isExporting = ref(false)
  const filters = ref<BillingDocumentFilters>({
    date_from: '',
    date_to: '',
    document_type: '',
    search: ''
  })
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

      const response = await billingApi.getDocuments(limit, offset, filters.value)

      if (response.success && response.data) {
        documents.value = response.data
        if (response.pagination) {
          pagination.value = response.pagination
        }
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

  /**
   * Aplica los filtros actuales y recarga desde la primera página.
   */
  async function applyFilters(newFilters: Partial<BillingDocumentFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.offset = 0
    await fetchDocuments(pagination.value.limit, 0)
  }

  async function clearFilters() {
    filters.value = { date_from: '', date_to: '', document_type: '', search: '' }
    pagination.value.offset = 0
    await fetchDocuments(pagination.value.limit, 0)
  }

  /** Dispara la descarga de un blob con el nombre indicado. */
  function triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Exporta los comprobantes (CSV o Excel) respetando los filtros activos.
   */
  async function exportDocuments(format: 'csv' | 'xlsx' = 'csv') {
    try {
      isExporting.value = true
      error.value = null

      const blob = format === 'xlsx'
        ? await billingApi.exportDocumentsXlsx(filters.value)
        : await billingApi.exportDocuments(filters.value)

      const stamp = new Date().toISOString().slice(0, 10)
      triggerDownload(blob, `comprobantes_${stamp}.${format}`)
    } catch (err: any) {
      error.value = err.response?.data?.message || `No se pudo exportar el ${format.toUpperCase()}`
      console.error('Error al exportar comprobantes:', err)
    } finally {
      isExporting.value = false
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
      console.error('Error al emitir comprobante:', err)
      console.error('Response data:', err.response?.data)

      // Extraer el mensaje legible. El backend CI4 responde los fail() como
      // { status, error, messages: { error } }, así que ese es el primer lugar
      // a mirar; luego { message } y los errores de validación. NUNCA volcar el
      // JSON crudo al usuario (antes mostraba el envelope completo del 409).
      const data = err.response?.data
      const errorMsg = data?.messages?.error
        || data?.message
        || (data?.errors && typeof data.errors === 'object'
              ? Object.values(data.errors).join(' ')
              : null)
        || (typeof data === 'string' ? data : null)
        || 'Error al emitir el comprobante'

      error.value = errorMsg
      return { success: false, error: errorMsg }
    } finally {
      isEmitting.value = false
    }
  }

  /**
   * Descarga on-demand el PDF/XML de un comprobante legacy FacturaenUna (id=1).
   * Lanza excepción si el proveedor falla (la vista muestra el toast).
   */
  async function downloadLegacyDocument(id: number, type: 'pdf' | 'xml', filename: string) {
    const blob = await billingApi.downloadLegacyFile(id, type)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.${type}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
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
    isExporting,
    error,
    successMessage,
    filters,
    pagination,
    // Actions
    fetchDocuments,
    fetchDocumentDetail,
    emitDocument,
    applyFilters,
    clearFilters,
    exportDocuments,
    downloadLegacyDocument,
    clearMessages,
    clearCurrentDocument
  }
})
