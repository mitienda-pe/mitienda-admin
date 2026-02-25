<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Suscripcion</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Estado de tu plan, uso y historial de pagos
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="planStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <AppErrorState
      v-else-if="planStore.error"
      :message="planStore.error"
      @retry="loadData"
    />

    <!-- Content -->
    <div v-else class="space-y-6">

      <!-- Card 1: Plan Actual -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-star text-primary"></i>
          Plan Actual
        </h2>

        <div v-if="planStore.plan" class="space-y-4">
          <!-- Plan name + badge -->
          <div class="flex items-center gap-3">
            <span class="text-2xl font-bold text-secondary">{{ planStore.plan.name }}</span>
            <AppBadge
              :label="statusLabel(planStore.plan.status)"
              :variant="statusVariant(planStore.plan.status)"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Start date -->
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-secondary-500 uppercase tracking-wide mb-1">Fecha de inicio</p>
              <p class="text-lg font-semibold text-secondary">
                {{ activeSubscription ? formatDate(activeSubscription.start_date) : 'N/A' }}
              </p>
            </div>

            <!-- Renewal / expiry date -->
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-secondary-500 uppercase tracking-wide mb-1">Fecha de renovacion</p>
              <p class="text-lg font-semibold text-secondary">
                {{ planStore.plan.expires_at ? formatDate(planStore.plan.expires_at) : 'N/A' }}
              </p>
            </div>

            <!-- Days remaining -->
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-secondary-500 uppercase tracking-wide mb-1">Dias restantes</p>
              <p class="text-lg font-semibold" :class="daysColor(planStore.plan.days_remaining)">
                {{ planStore.plan.days_remaining }} dias
              </p>
            </div>
          </div>
        </div>

        <AppEmptyState
          v-else
          title="Sin plan activo"
          description="No se encontro un plan activo para esta tienda"
          icon="pi pi-info-circle"
        />
      </div>

      <!-- Card 2: Uso del Plan (Quotas) -->
      <div v-if="planStore.quotas" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-chart-bar text-primary"></i>
          Uso del Plan
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Products -->
          <QuotaBar
            label="Productos"
            icon="pi pi-box"
            :current="planStore.quotas.current_products"
            :max="planStore.quotas.max_products"
          />

          <!-- Pages -->
          <QuotaBar
            label="Paginas"
            icon="pi pi-file"
            :current="planStore.quotas.current_pages"
            :max="planStore.quotas.max_pages"
          />

          <!-- Users -->
          <QuotaBar
            label="Usuarios"
            icon="pi pi-users"
            :current="planStore.quotas.current_users"
            :max="planStore.quotas.max_users"
          />
        </div>
      </div>

      <!-- Card 3: Historial de Pagos -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-history text-primary"></i>
          Historial de Suscripciones
        </h2>

        <div v-if="planStore.isLoadingHistory" class="flex justify-center py-10">
          <ProgressSpinner />
        </div>

        <AppErrorState
          v-else-if="planStore.historyError"
          :message="planStore.historyError"
          @retry="planStore.fetchSubscriptionHistory"
        />

        <AppEmptyState
          v-else-if="!planStore.subscriptionHistory.length"
          title="Sin historial"
          description="No se encontraron registros de suscripciones"
          icon="pi pi-calendar"
        />

        <DataTable
          v-else
          :value="planStore.subscriptionHistory"
          stripedRows
          class="p-datatable-sm"
          responsiveLayout="scroll"
        >
          <Column field="plan_name" header="Plan">
            <template #body="{ data }">
              <span class="font-medium text-secondary">{{ data.plan_name }}</span>
              <span v-if="data.detail" class="text-xs text-secondary-500 ml-1">({{ data.detail }})</span>
            </template>
          </Column>
          <Column field="start_date" header="Inicio">
            <template #body="{ data }">
              {{ formatDate(data.start_date) }}
            </template>
          </Column>
          <Column field="end_date" header="Vencimiento">
            <template #body="{ data }">
              {{ formatDate(data.end_date) }}
            </template>
          </Column>
          <Column field="price" header="Precio" style="text-align: right">
            <template #body="{ data }">
              <span v-if="data.is_trial" class="text-secondary-400">Gratis</span>
              <span v-else>{{ formatCurrency(data.price) }}</span>
            </template>
          </Column>
          <Column field="payment_method" header="Medio de Pago">
            <template #body="{ data }">
              {{ data.payment_method || '-' }}
            </template>
          </Column>
          <Column field="status" header="Estado">
            <template #body="{ data }">
              <AppBadge
                :label="statusLabel(data.status)"
                :variant="statusVariant(data.status)"
                size="small"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, defineComponent } from 'vue'
import { usePlanStore } from '@/stores/plan.store'
import { useFormatters } from '@/composables/useFormatters'
import { AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const planStore = usePlanStore()
const { formatDate, formatCurrency } = useFormatters()

const activeSubscription = computed(() =>
  planStore.subscriptionHistory.find(s => s.status === 'active' || s.status === 'trial')
)

function statusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Activo'
    case 'trial': return 'Prueba'
    case 'expired': return 'Expirado'
    default: return status
  }
}

function statusVariant(status: string): 'success' | 'info' | 'neutral' | 'warning' | 'danger' {
  switch (status) {
    case 'active': return 'success'
    case 'trial': return 'info'
    case 'expired': return 'neutral'
    default: return 'neutral'
  }
}

function daysColor(days: number): string {
  if (days > 30) return 'text-green-600'
  if (days >= 7) return 'text-yellow-600'
  return 'text-red-600'
}

async function loadData() {
  await Promise.all([
    planStore.fetchPlan(),
    planStore.fetchSubscriptionHistory()
  ])
}

onMounted(() => {
  loadData()
})

// QuotaBar inline component
const QuotaBar = defineComponent({
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    current: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  setup(props) {
    const isUnlimited = computed(() => props.max === 0)
    const percentage = computed(() => {
      if (isUnlimited.value) return 0
      return Math.min(Math.round((props.current / props.max) * 100), 100)
    })
    const barColor = computed(() => {
      if (isUnlimited.value) return 'bg-primary'
      if (percentage.value >= 90) return 'bg-red-500'
      if (percentage.value >= 70) return 'bg-yellow-500'
      return 'bg-primary'
    })
    return { isUnlimited, percentage, barColor }
  },
  template: `
    <div>
      <div class="flex items-center justify-between mb-2">
        <span class="flex items-center gap-2 text-sm font-medium text-secondary-700">
          <i :class="icon + ' text-primary'"></i>
          {{ label }}
        </span>
        <span class="text-sm text-secondary-500">
          {{ current }} / {{ isUnlimited ? 'Ilimitado' : max }}
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div
          v-if="!isUnlimited"
          :class="barColor"
          class="h-2.5 rounded-full transition-all duration-300"
          :style="{ width: percentage + '%' }"
        ></div>
        <div
          v-else
          class="bg-primary h-2.5 rounded-full w-full opacity-30"
        ></div>
      </div>
    </div>
  `
})
</script>
