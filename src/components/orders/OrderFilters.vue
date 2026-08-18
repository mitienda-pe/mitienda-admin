<script setup lang="ts">
import { ref } from 'vue'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import type { OrderStatus } from '@/types/order.types'

export type BilledFilter = 'all' | '1' | '0'

export interface OrderFiltersData {
  status: OrderStatus | 'all'
  dateFrom: Date | null
  dateTo: Date | null
  billed: BilledFilter
}

const props = defineProps<{
  modelValue: OrderFiltersData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: OrderFiltersData): void
  (e: 'clear'): void
}>()

const localFilters = ref<OrderFiltersData>({ ...props.modelValue })

// Solo estados de PAGO (no estados de envío).
// "Todos los estados" trae todo menos el 9 = Creado, que es el carrito
// abandonado en la pasarela y no una venta.
const statusOptions = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Pendiente', value: 'pending' },       // 2
  // 9: pagos asíncronos (PagoEfectivo, agentes) que se cobran después del
  // checkout. El listado los esconde por defecto; este filtro es la única
  // forma de revisarlos sin buscarlos uno por uno.
  { label: 'Sin pago iniciado', value: 'created' }, // 9
  { label: 'Pagado', value: 'paid' },             // 1
  { label: 'Rechazado', value: 'cancelled' },     // 0
  { label: 'Anulado', value: 'voided' },          // 4
  { label: 'Expirado', value: 'expired' },        // 12
  { label: 'Contracargo', value: 'chargeback' },  // 13
  { label: 'Reembolsado', value: 'refunded' }     // 14
]

const billedOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Facturado', value: '1' },
  { label: 'No facturado', value: '0' }
]

const handleFilterChange = () => {
  emit('update:modelValue', { ...localFilters.value })
}

const handleClear = () => {
  localFilters.value = {
    status: 'all',
    dateFrom: null,
    dateTo: null,
    billed: 'all'
  }
  emit('clear')
}

const hasActiveFilters = () => {
  return (
    localFilters.value.status !== 'all' ||
    localFilters.value.dateFrom !== null ||
    localFilters.value.dateTo !== null ||
    localFilters.value.billed !== 'all'
  )
}
</script>

<template>
  <!-- Layout horizontal en desktop, vertical en móvil -->
  <div class="bg-white border border-gray-200 rounded-lg p-4">
    <div class="flex flex-col md:flex-row md:items-end gap-4">
      <!-- Estado -->
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700 mb-2">Estado de Pago</label>
        <Dropdown
          v-model="localFilters.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          placeholder="Seleccionar estado"
          class="w-full"
          @change="handleFilterChange"
        />
      </div>

      <!-- Facturación -->
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700 mb-2">Facturación</label>
        <Dropdown
          v-model="localFilters.billed"
          :options="billedOptions"
          option-label="label"
          option-value="value"
          placeholder="Seleccionar"
          class="w-full"
          @change="handleFilterChange"
        />
      </div>

      <!-- Fecha desde -->
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha desde</label>
        <Calendar
          v-model="localFilters.dateFrom"
          placeholder="Seleccionar fecha"
          date-format="dd/mm/yy"
          show-icon
          :max-date="localFilters.dateTo || new Date()"
          class="w-full"
          @date-select="handleFilterChange"
        />
      </div>

      <!-- Fecha hasta -->
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha hasta</label>
        <Calendar
          v-model="localFilters.dateTo"
          placeholder="Seleccionar fecha"
          date-format="dd/mm/yy"
          show-icon
          :min-date="localFilters.dateFrom || undefined"
          :max-date="new Date()"
          class="w-full"
          @date-select="handleFilterChange"
        />
      </div>

      <!-- Botón limpiar -->
      <div>
        <Button
          v-if="hasActiveFilters()"
          label="Limpiar"
          icon="pi pi-filter-slash"
          outlined
          @click="handleClear"
        />
      </div>
    </div>
  </div>
</template>
