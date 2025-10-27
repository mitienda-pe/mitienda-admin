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

      <!-- Customer Info Warning (for Factura) -->
      <div v-if="selectedDocumentType === 1" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div class="flex gap-2">
          <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">Requisitos para Factura</p>
            <p>Asegúrese de que el cliente tenga RUC registrado y los datos fiscales completos.</p>
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
          :disabled="!selectedDocumentType"
          @click="handleEmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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

const selectedDocumentType = ref<DocumentType | null>(null)
const isEmitting = ref(false)
const errorMessage = ref<string | null>(null)

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const title = computed(() => {
  return isEmitting.value ? 'Emitiendo comprobante...' : 'Emitir Comprobante de Pago'
})

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
