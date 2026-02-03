<script setup lang="ts">
import { computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import { useFormatters } from '@/composables/useFormatters'
import type { ManualDocumentItem } from '@/types/billing.types'

const IGV_RATE = 0.18

interface Props {
  items: ManualDocumentItem[]
}

interface Emits {
  (e: 'update:item', id: string, updates: Partial<ManualDocumentItem>): void
  (e: 'remove:item', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { formatCurrency } = useFormatters()

// Computed items with calculated totals
const itemsWithTotals = computed(() => {
  return props.items.map(item => {
    const unitPrice = item.unit_price || 0
    const quantity = item.quantity || 0
    const unitPriceWithoutIgv = unitPrice / (1 + IGV_RATE)
    const subtotal = unitPriceWithoutIgv * quantity
    const igv = subtotal * IGV_RATE
    const total = subtotal + igv

    return {
      ...item,
      unit_price_without_igv: Math.round(unitPriceWithoutIgv * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      igv: Math.round(igv * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  })
})

// Handle quantity change
function onQuantityChange(item: ManualDocumentItem, value: number | null) {
  emit('update:item', item.id!, { quantity: value || 0 })
}

// Handle price change
function onPriceChange(item: ManualDocumentItem, value: number | null) {
  emit('update:item', item.id!, { unit_price: value || 0 })
}

// Handle description change
function onDescriptionChange(item: ManualDocumentItem, value: string) {
  emit('update:item', item.id!, { description: value })
}

// Handle remove
function onRemove(item: ManualDocumentItem) {
  emit('remove:item', item.id!)
}
</script>

<template>
  <DataTable
    :value="itemsWithTotals"
    :emptyMessage="'No hay productos agregados'"
    class="p-datatable-sm"
    responsiveLayout="scroll"
  >
    <Column field="code" header="Código" style="width: 100px">
      <template #body="{ data }">
        <span class="font-mono text-sm text-gray-500">{{ data.code || '-' }}</span>
      </template>
    </Column>

    <Column field="description" header="Descripción" style="min-width: 200px">
      <template #body="{ data }">
        <InputText
          :modelValue="data.description"
          class="w-full text-sm"
          @update:modelValue="onDescriptionChange(data, $event as string)"
        />
      </template>
    </Column>

    <Column field="quantity" header="Cantidad" style="width: 100px">
      <template #body="{ data }">
        <InputNumber
          :modelValue="data.quantity"
          :min="0.01"
          :maxFractionDigits="2"
          inputClass="w-full text-right text-sm"
          @update:modelValue="onQuantityChange(data, $event)"
        />
      </template>
    </Column>

    <Column field="unit_price" header="P. Unit (c/IGV)" style="width: 130px">
      <template #body="{ data }">
        <InputNumber
          :modelValue="data.unit_price"
          mode="currency"
          currency="PEN"
          locale="es-PE"
          :min="0"
          :maxFractionDigits="2"
          inputClass="w-full text-right text-sm"
          @update:modelValue="onPriceChange(data, $event)"
        />
      </template>
    </Column>

    <Column field="subtotal" header="Subtotal" style="width: 100px">
      <template #body="{ data }">
        <span class="font-mono text-sm text-right block">{{ formatCurrency(data.subtotal) }}</span>
      </template>
    </Column>

    <Column field="igv" header="IGV" style="width: 80px">
      <template #body="{ data }">
        <span class="font-mono text-sm text-right block text-gray-500">{{ formatCurrency(data.igv) }}</span>
      </template>
    </Column>

    <Column field="total" header="Total" style="width: 100px">
      <template #body="{ data }">
        <span class="font-mono text-sm text-right block font-semibold">{{ formatCurrency(data.total) }}</span>
      </template>
    </Column>

    <Column style="width: 50px">
      <template #body="{ data }">
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          size="small"
          @click="onRemove(data)"
          v-tooltip.top="'Eliminar'"
        />
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
:deep(.p-inputtext),
:deep(.p-inputnumber-input) {
  padding: 0.375rem 0.5rem;
}
</style>
