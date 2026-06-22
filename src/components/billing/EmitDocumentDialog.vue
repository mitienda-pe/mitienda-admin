<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="title"
    :style="{ width: '32rem' }"
    :closable="!isEmitting"
    :draggable="false"
  >
    <div class="space-y-4 py-4">
      <!-- Order Info -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-shopping-cart text-primary"></i>
          <span class="font-semibold text-gray-900">Pedido #{{ orderNumber }}</span>
        </div>
        <p class="text-sm text-gray-600">
          Total: <span class="font-semibold text-gray-900">{{ formatCurrency(orderTotal) }}</span>
        </p>
      </div>

      <!-- Comprobante solicitado por el cliente (del checkout) -->
      <div v-if="requestedLabel" class="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p class="text-xs text-gray-500 mb-0.5">El cliente solicitó</p>
        <p class="text-sm font-semibold text-gray-900">
          {{ requestedLabel }}
          <span v-if="requestedDocNumber" class="font-normal text-gray-600">
            · {{ requestedDocType || 'Doc' }} {{ requestedDocNumber }}
          </span>
        </p>
        <p v-if="requestedBusinessName" class="text-sm text-gray-600">{{ requestedBusinessName }}</p>
      </div>

      <!-- Document Type Selection -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700">
          Tipo de Comprobante
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="selectedDocumentType = 1"
            :disabled="isEmitting"
            :class="[
              'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
              selectedDocumentType === 1
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50',
              isEmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            <i class="pi pi-file text-2xl" :class="selectedDocumentType === 1 ? 'text-primary' : 'text-gray-400'"></i>
            <span class="font-medium" :class="selectedDocumentType === 1 ? 'text-primary' : 'text-gray-700'">
              Factura
            </span>
          </button>

          <button
            type="button"
            @click="selectedDocumentType = 2"
            :disabled="isEmitting"
            :class="[
              'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
              selectedDocumentType === 2
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50',
              isEmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            <i class="pi pi-receipt text-2xl" :class="selectedDocumentType === 2 ? 'text-primary' : 'text-gray-400'"></i>
            <span class="font-medium" :class="selectedDocumentType === 2 ? 'text-primary' : 'text-gray-700'">
              Boleta
            </span>
          </button>
        </div>
      </div>

      <!-- Mismatch: el operador eligió un tipo distinto al solicitado -->
      <div v-if="isMismatch" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div class="flex gap-2">
          <i class="pi pi-exclamation-triangle text-amber-600 mt-0.5"></i>
          <div class="text-sm text-amber-800">
            <p class="font-medium">Estás emitiendo un tipo distinto al solicitado</p>
            <p>El cliente pidió <span class="font-semibold">{{ requestedLabel }}</span> y vas a emitir
              <span class="font-semibold">{{ selectedDocumentType === 1 ? 'Factura' : 'Boleta' }}</span>.</p>
          </div>
        </div>
      </div>

      <!-- Factura sin RUC válido del receptor -->
      <div v-if="facturaMissingRuc" class="bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex gap-2">
          <i class="pi pi-times-circle text-red-600 mt-0.5"></i>
          <div class="text-sm text-red-800">
            <p class="font-medium">Falta RUC válido para Factura</p>
            <p>El receptor no tiene un RUC de 11 dígitos. Una factura requiere RUC; corrige los datos del cliente o emite Boleta.</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <Message v-if="errorMessage" severity="error" @close="errorMessage = null">
        {{ errorMessage }}
      </Message>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Cancelar"
          text
          :disabled="isEmitting"
          @click="handleCancel"
        />
        <Button
          label="Emitir Comprobante"
          icon="pi pi-file-pdf"
          :loading="isEmitting"
          :disabled="!selectedDocumentType || facturaMissingRuc"
          @click="handleEmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBillingDocumentsStore } from '@/stores/billingDocuments.store'
import { useFormatters } from '@/composables/useFormatters'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'
import type { DocumentType } from '@/types/billing.types'

interface Props {
  visible: boolean
  orderId: number
  orderNumber: string
  orderTotal: number
  // Lo que el cliente pidió en el checkout (deriva de documento_id_facturacion):
  requestedType?: DocumentType | null // 1=Factura, 2=Boleta
  requestedDocType?: string // 'DNI' | 'RUC' | ...
  requestedDocNumber?: string
  requestedBusinessName?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const billingStore = useBillingDocumentsStore()
const { formatCurrency } = useFormatters()

const selectedDocumentType = ref<DocumentType | null>(props.requestedType ?? null)
const isEmitting = ref(false)
const errorMessage = ref<string | null>(null)

// Al abrir el diálogo, pre-seleccionar lo que el cliente pidió.
watch(() => props.visible, (open) => {
  if (open) {
    selectedDocumentType.value = props.requestedType ?? null
    errorMessage.value = null
  }
})

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const title = computed(() => {
  return isEmitting.value ? 'Emitiendo comprobante...' : 'Emitir Comprobante de Pago'
})

const requestedLabel = computed(() => {
  if (props.requestedType === 1) return 'Factura'
  if (props.requestedType === 2) return 'Boleta'
  return null
})

// El operador eligió un tipo distinto al solicitado por el cliente.
const isMismatch = computed(() =>
  !!props.requestedType && !!selectedDocumentType.value && selectedDocumentType.value !== props.requestedType
)

// Para Factura el receptor debe tener RUC válido (11 dígitos).
const hasValidRuc = computed(() => /^\d{11}$/.test((props.requestedDocNumber || '').trim()))
const facturaMissingRuc = computed(() => selectedDocumentType.value === 1 && !hasValidRuc.value)

const handleCancel = () => {
  if (!isEmitting.value) {
    selectedDocumentType.value = null
    errorMessage.value = null
    isVisible.value = false
  }
}

const handleEmit = async () => {
  if (!selectedDocumentType.value) return

  try {
    isEmitting.value = true
    errorMessage.value = null

    const result = await billingStore.emitDocument({
      order_id: props.orderId,
      document_type: selectedDocumentType.value
    })

    if (result.success) {
      // Close dialog
      isVisible.value = false
      // Reset state
      selectedDocumentType.value = null
      // Emit success event
      emit('success')
      // Navigate to documents list after a short delay
      setTimeout(() => {
        router.push('/billing/documents')
      }, 1000)
    } else {
      errorMessage.value = result.error || 'Error al emitir el comprobante'
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Error inesperado al emitir el comprobante'
  } finally {
    isEmitting.value = false
  }
}
</script>
