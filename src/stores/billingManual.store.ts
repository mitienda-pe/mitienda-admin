import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { billingApi } from '@/api/billing.api'
import type {
  ManualDocumentType,
  ManualDocumentClient,
  ManualDocumentItem,
  ManualEmitRequest,
  ManualEmitResponse,
  ReferenceDocument,
  DniLookupResult,
  RucLookupResult
} from '@/types/billing.types'

const IGV_RATE = 0.18

export const useBillingManualStore = defineStore('billingManual', () => {
  // ========== State ==========
  const documentType = ref<ManualDocumentType>(2) // Default to Boleta
  const client = ref<ManualDocumentClient>({
    document_type: 0,
    document_number: '',
    names: '',
    last_names: '',
    business_name: '',
    address: '',
    email: '',
    ubigeo: ''
  })
  const items = ref<ManualDocumentItem[]>([])
  const notes = ref('')
  const pdfFormat = ref<'A4' | 'TICKET' | '80MM'>('A4')

  // Credit note fields
  const referenceDocument = ref<ReferenceDocument | null>(null)
  const creditNoteType = ref<string>('01')
  const creditNoteReason = ref<string>('')

  // UI state
  const isEmitting = ref(false)
  const isLookingUp = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const lastEmitResponse = ref<ManualEmitResponse | null>(null)

  // ========== Computed ==========
  const totals = computed(() => {
    let totalGravada = 0
    let totalIgv = 0

    for (const item of items.value) {
      const unitPrice = item.unit_price || 0
      const quantity = item.quantity || 0
      const unitPriceWithoutIgv = unitPrice / (1 + IGV_RATE)
      const subtotal = unitPriceWithoutIgv * quantity
      const igv = subtotal * IGV_RATE

      totalGravada += subtotal
      totalIgv += igv
    }

    return {
      subtotal: Math.round(totalGravada * 100) / 100,
      igv: Math.round(totalIgv * 100) / 100,
      total: Math.round((totalGravada + totalIgv) * 100) / 100
    }
  })

  const isValid = computed(() => {
    // Must have at least one item
    if (items.value.length === 0) return false

    // All items must have description, quantity > 0, unit_price > 0
    for (const item of items.value) {
      if (!item.description) return false
      if (!item.quantity || item.quantity <= 0) return false
      if (!item.unit_price || item.unit_price <= 0) return false
    }

    // Factura requires RUC
    if (documentType.value === 1) {
      if (client.value.document_type !== 2) return false
      if (!client.value.document_number || client.value.document_number.length !== 11) return false
      if (!client.value.business_name) return false
    }

    // Boleta with DNI must have 8 digits
    if (documentType.value === 2 && client.value.document_type === 1) {
      if (client.value.document_number && client.value.document_number.length !== 8) return false
    }

    // Credit note requires reference
    if (documentType.value === 3) {
      if (!referenceDocument.value) return false
      if (!creditNoteType.value) return false
    }

    // Must have client name or business name
    const hasName = client.value.names || client.value.business_name
    if (!hasName) return false

    return true
  })

  const clientDisplayName = computed(() => {
    if (client.value.business_name) return client.value.business_name
    return [client.value.names, client.value.last_names].filter(Boolean).join(' ')
  })

  // ========== Actions ==========
  function setDocumentType(type: ManualDocumentType) {
    documentType.value = type

    // Reset client document type based on document type
    if (type === 1) {
      // Factura requires RUC
      client.value.document_type = 2
    }
  }

  function setClient(data: Partial<ManualDocumentClient>) {
    client.value = { ...client.value, ...data }
  }

  function setClientFromDniLookup(data: DniLookupResult) {
    client.value.document_type = 1 // DNI
    client.value.names = data.nombres
    client.value.last_names = `${data.apellidoPaterno} ${data.apellidoMaterno}`.trim()
    client.value.business_name = ''
  }

  function setClientFromRucLookup(data: RucLookupResult) {
    client.value.document_type = 2 // RUC
    client.value.business_name = data.razonSocial
    client.value.address = data.direccion || ''
    client.value.names = ''
    client.value.last_names = ''
  }

  function addItem(item: Omit<ManualDocumentItem, 'id'>) {
    const newItem: ManualDocumentItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    items.value.push(newItem)
  }

  function updateItem(id: string, updates: Partial<ManualDocumentItem>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
    }
  }

  function removeItem(id: string) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  function setReferenceDocument(doc: ReferenceDocument | null) {
    referenceDocument.value = doc
  }

  async function lookupDocument(documentNumber: string, type: 'dni' | 'ruc'): Promise<{ success: boolean; error?: string }> {
    try {
      isLookingUp.value = true
      error.value = null

      const response = await billingApi.lookupDocument(documentNumber, type)

      if (response.success && response.data) {
        if (type === 'dni') {
          setClientFromDniLookup(response.data as DniLookupResult)
        } else {
          setClientFromRucLookup(response.data as RucLookupResult)
        }
        return { success: true }
      } else {
        const errorMsg = (response as any).message || 'No se encontró información'
        error.value = errorMsg
        return { success: false, error: errorMsg }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al consultar documento'
      error.value = errorMsg
      return { success: false, error: errorMsg }
    } finally {
      isLookingUp.value = false
    }
  }

  async function emit(): Promise<{ success: boolean; error?: string; data?: ManualEmitResponse }> {
    if (!isValid.value) {
      return { success: false, error: 'Datos incompletos o inválidos' }
    }

    try {
      isEmitting.value = true
      error.value = null
      successMessage.value = null

      const request: ManualEmitRequest = {
        document_type: documentType.value,
        client: {
          document_type: client.value.document_type,
          document_number: client.value.document_number,
          names: client.value.names,
          last_names: client.value.last_names,
          business_name: client.value.business_name,
          address: client.value.address,
          email: client.value.email,
          ubigeo: client.value.ubigeo
        },
        items: items.value.map(item => ({
          product_id: item.product_id,
          code: item.code,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          affectation_type: item.affectation_type
        })),
        pdf_format: pdfFormat.value,
        notes: notes.value
      }

      // Add credit note fields if applicable
      if (documentType.value === 3 && referenceDocument.value) {
        request.reference_document = referenceDocument.value
        request.credit_note_type = creditNoteType.value
        request.reason = creditNoteReason.value
      }

      const response = await billingApi.emitManualDocument(request)

      if (response.success && response.data) {
        lastEmitResponse.value = response.data
        successMessage.value = 'Comprobante emitido exitosamente'
        return { success: true, data: response.data }
      } else {
        const errorMsg = (response as any).message || 'Error al emitir comprobante'
        error.value = errorMsg
        return { success: false, error: errorMsg }
      }
    } catch (err: any) {
      console.error('Error al emitir comprobante manual:', err)
      const errorMsg = err.response?.data?.message || 'Error al emitir comprobante'
      error.value = errorMsg
      return { success: false, error: errorMsg }
    } finally {
      isEmitting.value = false
    }
  }

  function reset() {
    documentType.value = 2
    client.value = {
      document_type: 0,
      document_number: '',
      names: '',
      last_names: '',
      business_name: '',
      address: '',
      email: '',
      ubigeo: ''
    }
    items.value = []
    notes.value = ''
    pdfFormat.value = 'A4'
    referenceDocument.value = null
    creditNoteType.value = '01'
    creditNoteReason.value = ''
    error.value = null
    successMessage.value = null
    lastEmitResponse.value = null
  }

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  return {
    // State
    documentType,
    client,
    items,
    notes,
    pdfFormat,
    referenceDocument,
    creditNoteType,
    creditNoteReason,
    isEmitting,
    isLookingUp,
    error,
    successMessage,
    lastEmitResponse,
    // Computed
    totals,
    isValid,
    clientDisplayName,
    // Actions
    setDocumentType,
    setClient,
    setClientFromDniLookup,
    setClientFromRucLookup,
    addItem,
    updateItem,
    removeItem,
    setReferenceDocument,
    lookupDocument,
    emit,
    reset,
    clearMessages
  }
})
