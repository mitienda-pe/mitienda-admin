<script setup lang="ts">
import { ref } from 'vue'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import type { OrderStatus } from '@/types/order.types'

export interface OrderFiltersData {
  status: OrderStatus | 'all'
  dateFrom: Date | null
  dateTo: Date | null
}

const props = defineProps<{
  modelValue: OrderFiltersData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: OrderFiltersData): void
  (e: 'clear'): void
}>()

const localFilters = ref<OrderFiltersData>({ ...props.modelValue })

// Solo estados de PAGO (no estados de envío)
// 0 = rechazado, 1 = confirmado/pagado, 2 = pendiente
const statusOptions = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Pagado', value: 'paid' },
  { label: 'Rechazado', value: 'cancelled' }
]

const handleFilterChange = () => {
  emit('update:modelValue', { ...localFilters.value })
}

const handleClear = () => {
  localFilters.value = {
    status: 'all',
    dateFrom: null,
    dateTo: null
  }
  emit('clear')
}

const hasActiveFilters = () => {
  return (
    localFilters.value.status !== 'all' ||
    localFilters.value.dateFrom !== null ||
    localFilters.value.dateTo !== null
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
