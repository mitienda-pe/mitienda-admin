<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import type { ManualDocumentItem } from '@/types/billing.types'
import { useFormatters } from '@/composables/useFormatters'

const IGV_RATE = 0.18

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'add', item: Omit<ManualDocumentItem, 'id'>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { formatCurrency } = useFormatters()

// Form state
const code = ref('')
const description = ref('')
const unit = ref('NIU')
const quantity = ref<number>(1)
const unitPrice = ref<number>(0)
const affectationType = ref(10)

// Unit options
const unitOptions = [
  { label: 'Unidad (NIU)', value: 'NIU' },
  { label: 'Servicio (ZZ)', value: 'ZZ' },
  { label: 'Kilogramo (KGM)', value: 'KGM' },
  { label: 'Litro (LTR)', value: 'LTR' },
  { label: 'Metro (MTR)', value: 'MTR' },
  { label: 'Docena (DZN)', value: 'DZN' },
  { label: 'Par (PR)', value: 'PR' }
]

// Affectation type options
const affectationOptions = [
  { label: 'Gravado (IGV 18%)', value: 10 },
  { label: 'Inafecto', value: 20 },
  { label: 'Exonerado', value: 30 }
]

// Computed totals
const totals = computed(() => {
  const up = unitPrice.value || 0
  const qty = quantity.value || 0

  if (affectationType.value === 10) {
    // Gravado
    const unitPriceWithoutIgv = up / (1 + IGV_RATE)
    const subtotal = unitPriceWithoutIgv * qty
    const igv = subtotal * IGV_RATE
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      igv: Math.round(igv * 100) / 100,
      total: Math.round((subtotal + igv) * 100) / 100
    }
  } else {
    // No IGV
    const total = up * qty
    return {
      subtotal: Math.round(total * 100) / 100,
      igv: 0,
      total: Math.round(total * 100) / 100
    }
  }
})

// Is form valid
const isValid = computed(() => {
  return description.value.trim().length > 0 &&
         (quantity.value || 0) > 0 &&
         (unitPrice.value || 0) > 0
})

// Reset form
function resetForm() {
  code.value = ''
  description.value = ''
  unit.value = 'NIU'
  quantity.value = 1
  unitPrice.value = 0
  affectationType.value = 10
}

// Watch for dialog open/close
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    resetForm()
  }
})

// Handle add
function handleAdd() {
  if (!isValid.value) return

  const item: Omit<ManualDocumentItem, 'id'> = {
    code: code.value,
    description: description.value,
    unit: unit.value,
    quantity: quantity.value || 1,
    unit_price: unitPrice.value || 0,
    affectation_type: affectationType.value
  }

  emit('add', item)
  emit('update:visible', false)
}

// Handle cancel
function onCancel() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Agregar Item Manual"
    :modal="true"
    :closable="true"
    :style="{ width: '500px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <!-- Code (optional) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Código (opcional)</label>
        <InputText
          v-model="code"
          placeholder="SKU o código interno"
          class="w-full"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Descripción <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="description"
          placeholder="Nombre del producto o servicio"
          class="w-full"
          autofocus
        />
      </div>

      <!-- Unit and Quantity Row -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
          <Dropdown
            v-model="unit"
            :options="unitOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Cantidad <span class="text-red-500">*</span>
          </label>
          <InputNumber
            v-model="quantity"
            :min="0.01"
            :maxFractionDigits="2"
            class="w-full"
          />
        </div>
      </div>

      <!-- Price and Affectation Row -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Precio Unitario (c/IGV) <span class="text-red-500">*</span>
          </label>
          <InputNumber
            v-model="unitPrice"
            mode="currency"
            currency="PEN"
            locale="es-PE"
            :min="0"
            :maxFractionDigits="2"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Afectación</label>
          <Dropdown
            v-model="affectationType"
            :options="affectationOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <!-- Totals Preview -->
      <div class="bg-gray-50 rounded-lg p-4 mt-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Vista Previa</h4>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Subtotal:</span>
            <span class="block font-mono">{{ formatCurrency(totals.subtotal) }}</span>
          </div>
          <div>
            <span class="text-gray-500">IGV:</span>
            <span class="block font-mono">{{ formatCurrency(totals.igv) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Total:</span>
            <span class="block font-mono font-semibold">{{ formatCurrency(totals.total) }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="onCancel" />
      <Button label="Agregar" icon="pi pi-plus" :disabled="!isValid" @click="handleAdd" />
    </template>
  </Dialog>
</template>
