<template>
  <Card class="mb-6">
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-filter text-primary"></i>
        <span>Filtros</span>
      </div>
    </template>
    <template #content>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Date Range -->
        <div class="flex flex-col gap-2">
          <label for="date-from" class="text-sm font-medium text-secondary-700">
            Desde
          </label>
          <Calendar
            id="date-from"
            v-model="localFilters.date_from"
            dateFormat="dd/mm/yy"
            placeholder="Seleccionar fecha"
            :showIcon="true"
            :maxDate="localFilters.date_to || new Date()"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="date-to" class="text-sm font-medium text-secondary-700">
            Hasta
          </label>
          <Calendar
            id="date-to"
            v-model="localFilters.date_to"
            dateFormat="dd/mm/yy"
            placeholder="Seleccionar fecha"
            :showIcon="true"
            :minDate="localFilters.date_from"
            :maxDate="new Date()"
            class="w-full"
          />
        </div>

        <!-- Payment Status -->
        <div class="flex flex-col gap-2">
          <label for="payment-status" class="text-sm font-medium text-secondary-700">
            Estado de Pago
          </label>
          <Dropdown
            id="payment-status"
            v-model="localFilters.payment_status"
            :options="paymentStatusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos"
            class="w-full"
          />
        </div>

        <!-- Payment Gateway -->
        <div class="flex flex-col gap-2">
          <label for="payment-gateway" class="text-sm font-medium text-secondary-700">
            Pasarela de Pago
          </label>
          <Dropdown
            id="payment-gateway"
            v-model="localFilters.payment_gateway_id"
            :options="paymentGatewayOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Todas"
            class="w-full"
            :loading="loadingGateways"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 mt-6">
        <AppButton
          label="Aplicar Filtros"
          icon="pi pi-search"
          @click="handleApplyFilters"
          :disabled="!hasValidDateRange"
        />
        <AppButton
          label="Limpiar"
          icon="pi pi-times"
          severity="secondary"
          outlined
          @click="handleClearFilters"
        />
      </div>

      <div v-if="!hasValidDateRange" class="mt-3">
        <p class="text-sm text-orange-600">
          <i class="pi pi-exclamation-triangle mr-1"></i>
          Por favor selecciona un rango de fechas válido
        </p>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Card from 'primevue/card'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import { AppButton } from '@/components/ui'
import { PaymentStatus, type ReportFilters } from '@/types/report.types'

interface Props {
  filters: ReportFilters
  paymentGateways?: Array<{ id: number; name: string }>
  loadingGateways?: boolean
}

interface Emits {
  (e: 'update:filters', filters: ReportFilters): void
  (e: 'apply'): void
}

const props = withDefaults(defineProps<Props>(), {
  paymentGateways: () => [],
  loadingGateways: false
})

const emit = defineEmits<Emits>()

// Local state for v-model binding
const localFilters = ref<ReportFilters>({ ...props.filters })

// Payment Status Options
const paymentStatusOptions = [
  { label: 'Todos', value: PaymentStatus.ALL },
  { label: 'Aprobado', value: PaymentStatus.APPROVED },
  { label: 'Pendiente', value: PaymentStatus.PENDING },
  { label: 'Rechazado', value: PaymentStatus.REJECTED },
  { label: 'Expirado', value: PaymentStatus.EXPIRED }
]

// Payment Gateway Options
const paymentGatewayOptions = computed(() => {
  return [
    { label: 'Todas', value: 0 },
    ...props.paymentGateways.map(gateway => ({
      label: gateway.name,
      value: gateway.id
    }))
  ]
})

// Validation
const hasValidDateRange = computed(() => {
  return localFilters.value.date_from && localFilters.value.date_to
})

// Handlers
const handleApplyFilters = () => {
  if (!hasValidDateRange.value) return

  // Convert Date objects to ISO strings
  const filters: ReportFilters = {
    date_from: localFilters.value.date_from
      ? formatDateToISO(localFilters.value.date_from as Date)
      : undefined,
    date_to: localFilters.value.date_to
      ? formatDateToISO(localFilters.value.date_to as Date)
      : undefined,
    payment_status: localFilters.value.payment_status,
    payment_gateway_id: localFilters.value.payment_gateway_id
  }

  emit('update:filters', filters)
  emit('apply')
}

const handleClearFilters = () => {
  localFilters.value = {
    date_from: undefined,
    date_to: undefined,
    payment_status: PaymentStatus.ALL,
    payment_gateway_id: 0
  }
}

// Helper function to format date to ISO
const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })
</script>
