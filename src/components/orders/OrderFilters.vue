<script setup lang="ts">
import { ref, watch } from 'vue'
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

const statusOptions = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Pagado', value: 'paid' },
  { label: 'Enviado', value: 'shipped' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' }
]

watch(
  localFilters,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true }
)

watch(
  () => props.modelValue,
  (newValue) => {
    localFilters.value = { ...newValue }
  },
  { deep: true }
)

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
  <div class="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-gray-900">Filtros</h3>
      <Button
        v-if="hasActiveFilters()"
        label="Limpiar"
        icon="pi pi-filter-slash"
        text
        size="small"
        @click="handleClear"
      />
    </div>

    <!-- Estado -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
      <Dropdown
        v-model="localFilters.status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="Seleccionar estado"
        class="w-full"
      />
    </div>

    <!-- Fecha desde -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Fecha desde</label>
      <Calendar
        v-model="localFilters.dateFrom"
        placeholder="Seleccionar fecha"
        date-format="dd/mm/yy"
        show-icon
        :max-date="localFilters.dateTo || new Date()"
        class="w-full"
      />
    </div>

    <!-- Fecha hasta -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Fecha hasta</label>
      <Calendar
        v-model="localFilters.dateTo"
        placeholder="Seleccionar fecha"
        date-format="dd/mm/yy"
        show-icon
        :min-date="localFilters.dateFrom || undefined"
        :max-date="new Date()"
        class="w-full"
      />
    </div>
  </div>
</template>
