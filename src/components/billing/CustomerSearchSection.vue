<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Message from 'primevue/message'
import type { ManualDocumentType, ManualDocumentClient, ClientDocumentType } from '@/types/billing.types'

interface Props {
  documentType: ManualDocumentType
  client: ManualDocumentClient
  isLookingUp: boolean
}

interface Emits {
  (e: 'update:client', data: Partial<ManualDocumentClient>): void
  (e: 'lookup', documentNumber: string, type: 'dni' | 'ruc'): Promise<{ success: boolean; error?: string }>
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const lookupError = ref<string | null>(null)

// Document type options
const documentTypeOptions = [
  { label: 'Sin documento', value: 0 as ClientDocumentType },
  { label: 'DNI', value: 1 as ClientDocumentType },
  { label: 'RUC', value: 2 as ClientDocumentType }
]

// Filter options based on document type
const filteredDocumentTypeOptions = computed(() => {
  // Factura requires RUC
  if (props.documentType === 1) {
    return documentTypeOptions.filter(opt => opt.value === 2)
  }
  return documentTypeOptions
})

// Determine if we can lookup
const canLookup = computed(() => {
  const docNumber = props.client.document_number || ''
  const docType = props.client.document_type

  if (docType === 1 && docNumber.length === 8) return true // DNI
  if (docType === 2 && docNumber.length === 11) return true // RUC

  return false
})

// Handle document type change
function onDocumentTypeChange(type: ClientDocumentType) {
  emit('update:client', {
    document_type: type,
    document_number: '',
    names: '',
    last_names: '',
    business_name: '',
    address: ''
  })
  lookupError.value = null
}

// Handle document number input
function onDocumentNumberInput(value: string) {
  // Only allow numbers
  const cleaned = value.replace(/\D/g, '')
  emit('update:client', { document_number: cleaned })
}

// Handle lookup
async function handleLookup() {
  lookupError.value = null
  const type = props.client.document_type === 1 ? 'dni' : 'ruc'
  const result = await emit('lookup', props.client.document_number, type)
  if (!result.success) {
    lookupError.value = result.error || 'No se encontró información'
  }
}

// Watch for documentType changes to auto-set client document type for Factura
watch(() => props.documentType, (newType) => {
  if (newType === 1 && props.client.document_type !== 2) {
    emit('update:client', { document_type: 2 })
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <!-- Document Type and Number Row -->
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
        <Dropdown
          :modelValue="client.document_type"
          :options="filteredDocumentTypeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar"
          class="w-full"
          @update:modelValue="onDocumentTypeChange"
        />
      </div>

      <div class="col-span-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Número de Documento
          <span v-if="client.document_type === 1" class="text-gray-400">(8 dígitos)</span>
          <span v-if="client.document_type === 2" class="text-gray-400">(11 dígitos)</span>
        </label>
        <div class="flex gap-2">
          <InputText
            :modelValue="client.document_number"
            :maxlength="client.document_type === 2 ? 11 : 8"
            :placeholder="client.document_type === 2 ? '20123456789' : '12345678'"
            class="flex-1 font-mono"
            @update:modelValue="onDocumentNumberInput"
            @keyup.enter="canLookup && handleLookup()"
          />
          <Button
            icon="pi pi-search"
            :loading="isLookingUp"
            :disabled="!canLookup"
            severity="secondary"
            @click="handleLookup"
            v-tooltip.top="'Buscar en SUNAT/RENIEC'"
          />
        </div>
      </div>

      <div class="col-span-5">
        <template v-if="client.document_type === 2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Razón Social <span class="text-red-500">*</span></label>
          <InputText
            :modelValue="client.business_name"
            placeholder="Empresa S.A.C."
            class="w-full"
            @update:modelValue="$emit('update:client', { business_name: $event })"
          />
        </template>
        <template v-else>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombres <span class="text-red-500">*</span></label>
          <InputText
            :modelValue="client.names"
            placeholder="Juan Carlos"
            class="w-full"
            @update:modelValue="$emit('update:client', { names: $event })"
          />
        </template>
      </div>
    </div>

    <!-- Lookup Error -->
    <Message v-if="lookupError" severity="warn" :closable="true" @close="lookupError = null">
      {{ lookupError }}. Puede ingresar los datos manualmente.
    </Message>

    <!-- Additional Fields Row -->
    <div class="grid grid-cols-12 gap-4">
      <div v-if="client.document_type !== 2" class="col-span-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
        <InputText
          :modelValue="client.last_names"
          placeholder="Pérez García"
          class="w-full"
          @update:modelValue="$emit('update:client', { last_names: $event })"
        />
      </div>

      <div :class="client.document_type === 2 ? 'col-span-8' : 'col-span-4'">
        <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
        <InputText
          :modelValue="client.address"
          placeholder="Av. Principal 123, Lima"
          class="w-full"
          @update:modelValue="$emit('update:client', { address: $event })"
        />
      </div>

      <div class="col-span-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
        <InputText
          :modelValue="client.email"
          type="email"
          placeholder="cliente@email.com"
          class="w-full"
          @update:modelValue="$emit('update:client', { email: $event })"
        />
      </div>
    </div>

    <!-- Info message for Factura -->
    <Message v-if="documentType === 1" severity="info" :closable="false" class="mt-2">
      <span class="font-medium">Factura</span>: El cliente debe tener RUC (11 dígitos) y Razón Social.
    </Message>
  </div>
</template>
