<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWebhookSubscriptionsStore } from '@/stores/webhookSubscriptions.store'
import { useToast } from 'primevue/usetoast'
import { AppButton, AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import type {
  DashboardProviderStat,
  DashboardWebhookHealth,
  DashboardAlert,
  DomainEvent
} from '@/types/webhook-subscriptions.types'

const store = useWebhookSubscriptionsStore()
const toast = useToast()

// ─── Dashboard data ─────────────────────────────────
const summary = computed(() => store.dashboardData?.summary)
const providerStats = computed(() => store.dashboardData?.provider_stats ?? [])
const webhookHealth = computed(() => store.dashboardData?.webhook_health ?? [])
const alerts = computed(() => store.dashboardData?.alerts ?? [])

// ─── Events filters ─────────────────────────────────
const statusFilter = ref<string | null>(null)
const typeFilter = ref<string | null>(null)
const currentPage = ref(1)

// ─── Detail dialog ──────────────────────────────────
const showDetail = ref(false)
const selectedEvent = ref<DomainEvent | null>(null)
const detailLoading = ref(false)

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Procesando', value: 'processing' },
  { label: 'Completado', value: 'completed' },
  { label: 'Fallido', value: 'failed' },
  { label: 'Dead Letter', value: 'dead_letter' }
]

const typeOptions = ref<Array<{ label: string; value: string | null }>>([{ label: 'Todos', value: null }])

onMounted(async () => {
  await Promise.all([
    store.fetchDashboard(),
    loadEvents(),
    store.fetchEventStats(),
    store.fetchAvailableEvents()
  ])
  typeOptions.value = [
    { label: 'Todos', value: null },
    ...store.availableEvents.map(e => ({ label: e.label, value: e.type }))
  ]
})

// ─── Dashboard helpers ──────────────────────────────

function getSuccessRate(stat: DashboardProviderStat): number {
  if (!stat.total) return 100
  return Math.round((stat.success_count / stat.total) * 100 * 10) / 10
}

function getSuccessRateVariant(rate: number): 'success' | 'warning' | 'danger' {
  if (rate >= 95) return 'success'
  if (rate >= 80) return 'warning'
  return 'danger'
}

function getWebhookStatusVariant(wh: DashboardWebhookHealth): 'success' | 'warning' | 'danger' | 'neutral' {
  if (wh.status === 'disabled') return 'danger'
  if (wh.circuit_opened_at) return 'warning'
  if (wh.failure_count > 0) return 'warning'
  return 'success'
}

function getWebhookStatusLabel(wh: DashboardWebhookHealth): string {
  if (wh.status === 'disabled') return 'Deshabilitado'
  if (wh.circuit_opened_at) return 'Circuit abierto'
  if (wh.status === 'paused') return 'Pausado'
  return 'Activo'
}

function getWebhookSuccessRate(wh: DashboardWebhookHealth): string {
  if (!wh.deliveries_7d) return '-'
  return Math.round((wh.success_7d / wh.deliveries_7d) * 100) + '%'
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '-'
  if (ms < 1000) return ms + 'ms'
  return (ms / 1000).toFixed(1) + 's'
}

function truncateUrl(url: string, max = 50): string {
  if (url.length <= max) return url
  return url.substring(0, max) + '...'
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('es-PE')
}

function getAlertIcon(alert: DashboardAlert): string {
  return alert.level === 'danger' ? 'pi pi-exclamation-circle' : 'pi pi-exclamation-triangle'
}

// ─── Events helpers ─────────────────────────────────

async function loadEvents() {
  await store.fetchEvents({
    page: currentPage.value,
    status: statusFilter.value || undefined,
    event_type: typeFilter.value || undefined
  })
}

function onFilterChange() {
  currentPage.value = 1
  loadEvents()
}

function onPage(event: any) {
  currentPage.value = (event.page ?? 0) + 1
  loadEvents()
}

async function openDetail(event: DomainEvent) {
  detailLoading.value = true
  showDetail.value = true
  try {
    const response = await (await import('@/api/webhook-subscriptions.api')).webhookSubscriptionsApi.getEvent(event.id)
    if (response.success && response.data) {
      selectedEvent.value = response.data
    }
  } catch (e) {
    selectedEvent.value = event
  } finally {
    detailLoading.value = false
  }
}

async function retryEvent(event: DomainEvent) {
  const ok = await store.retryEvent(event.id)
  if (ok) {
    toast.add({ severity: 'success', summary: 'Re-encolado', detail: 'Evento enviado para reprocesamiento', life: 3000 })
    showDetail.value = false
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error || 'No se pudo reintentar', life: 3000 })
  }
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    dead_letter: 'danger'
  }
  return map[status] || 'neutral'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Completado',
    failed: 'Fallido',
    dead_letter: 'Dead Letter'
  }
  return map[status] || status
}

function refreshAll() {
  store.fetchDashboard()
  loadEvents()
  store.fetchEventStats()
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Monitor de Integraciones</h1>
        <p class="text-gray-500 mt-1">Observabilidad de eventos, proveedores y webhooks</p>
      </div>
      <AppButton variant="secondary" @click="refreshAll">
        <i class="pi pi-refresh mr-2" />
        Actualizar
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="store.dashboardLoading && !store.dashboardData" class="flex justify-center py-16">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <AppErrorState v-else-if="store.error && !store.dashboardData" :message="store.error" @retry="refreshAll" />

    <!-- Content -->
    <template v-else>
      <!-- ═══════════════════════════════════════════════════════
           SECTION 1: KPIs & Health
           ═══════════════════════════════════════════════════════ -->

      <!-- Alerts -->
      <div v-if="alerts.length" class="space-y-2 mb-6">
        <div
          v-for="(alert, i) in alerts"
          :key="i"
          class="flex items-center gap-3 px-4 py-3 rounded-lg"
          :class="{
            'bg-red-50 border border-red-200 text-red-800': alert.level === 'danger',
            'bg-yellow-50 border border-yellow-200 text-yellow-800': alert.level === 'warning'
          }"
        >
          <i :class="getAlertIcon(alert)" />
          <span class="text-sm font-medium">{{ alert.message }}</span>
        </div>
      </div>

      <!-- KPI Cards -->
      <div v-if="summary" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border rounded-lg p-4">
          <div class="text-sm text-gray-500">Eventos hoy</div>
          <div class="text-2xl font-bold text-gray-800">{{ summary.today ?? 0 }}</div>
        </div>
        <div class="bg-white border rounded-lg p-4">
          <div class="text-sm text-gray-500">Tasa de exito (7d)</div>
          <div class="text-2xl font-bold" :class="{
            'text-green-600': (summary.success_rate ?? 100) >= 95,
            'text-yellow-600': (summary.success_rate ?? 100) >= 80 && (summary.success_rate ?? 100) < 95,
            'text-red-600': (summary.success_rate ?? 100) < 80
          }">
            {{ summary.success_rate ?? 100 }}%
          </div>
        </div>
        <div class="bg-white border rounded-lg p-4">
          <div class="text-sm text-gray-500">Cola pendiente</div>
          <div class="text-2xl font-bold" :class="(summary.queue_depth ?? 0) > 50 ? 'text-yellow-600' : 'text-gray-800'">
            {{ summary.queue_depth ?? 0 }}
          </div>
          <div v-if="summary.oldest_pending_at" class="text-xs text-gray-400 mt-1">
            Desde {{ formatDate(summary.oldest_pending_at) }}
          </div>
        </div>
        <div class="bg-white border rounded-lg p-4">
          <div class="text-sm text-gray-500">Por estado</div>
          <div class="flex flex-wrap gap-1 mt-1">
            <template v-for="stat in summary.by_status" :key="stat.status">
              <AppBadge
                v-if="stat.count > 0"
                :variant="stat.status === 'completed' ? 'success' : stat.status === 'failed' ? 'danger' : stat.status === 'dead_letter' ? 'danger' : stat.status === 'pending' ? 'warning' : 'info'"
              >
                {{ stat.count }} {{ stat.status }}
              </AppBadge>
            </template>
          </div>
        </div>
      </div>

      <!-- Provider Stats Table -->
      <div v-if="providerStats.length" class="mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">Rendimiento por proveedor (7d)</h2>
        <DataTable :value="providerStats" stripedRows class="text-sm">
          <Column header="Proveedor" field="provider">
            <template #body="{ data }: { data: DashboardProviderStat }">
              <span class="font-medium capitalize">{{ data.provider }}</span>
            </template>
          </Column>
          <Column header="Total" field="total" />
          <Column header="Tasa exito">
            <template #body="{ data }: { data: DashboardProviderStat }">
              <AppBadge :variant="getSuccessRateVariant(getSuccessRate(data))">
                {{ getSuccessRate(data) }}%
              </AppBadge>
            </template>
          </Column>
          <Column header="Fallidos" field="failed_count">
            <template #body="{ data }: { data: DashboardProviderStat }">
              <span :class="data.failed_count > 0 ? 'text-red-600 font-medium' : 'text-gray-500'">
                {{ data.failed_count }}
              </span>
            </template>
          </Column>
          <Column header="Latencia prom.">
            <template #body="{ data }: { data: DashboardProviderStat }">
              {{ formatDuration(data.avg_duration_ms) }}
            </template>
          </Column>
          <Column header="Ultima actividad">
            <template #body="{ data }: { data: DashboardProviderStat }">
              <span class="text-gray-500 text-xs">{{ formatDate(data.last_activity) }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Webhook Health Table -->
      <div v-if="webhookHealth.length" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">Salud de webhooks</h2>
        <DataTable :value="webhookHealth" stripedRows class="text-sm">
          <Column header="URL">
            <template #body="{ data }: { data: DashboardWebhookHealth }">
              <span class="font-mono text-xs" :title="data.url">{{ truncateUrl(data.url) }}</span>
            </template>
          </Column>
          <Column header="Estado">
            <template #body="{ data }: { data: DashboardWebhookHealth }">
              <AppBadge :variant="getWebhookStatusVariant(data)">
                {{ getWebhookStatusLabel(data) }}
              </AppBadge>
            </template>
          </Column>
          <Column header="Tasa exito (7d)">
            <template #body="{ data }: { data: DashboardWebhookHealth }">
              {{ getWebhookSuccessRate(data) }}
            </template>
          </Column>
          <Column header="Fallos consec.">
            <template #body="{ data }: { data: DashboardWebhookHealth }">
              <span :class="data.failure_count >= 5 ? 'text-red-600 font-medium' : 'text-gray-600'">
                {{ data.failure_count }}
              </span>
            </template>
          </Column>
          <Column header="Entregas (7d)">
            <template #body="{ data }: { data: DashboardWebhookHealth }">
              {{ data.deliveries_7d }}
            </template>
          </Column>
          <Column header="Rate limit">
            <template #body="{ data }: { data: DashboardWebhookHealth }">
              <span class="text-gray-500">{{ data.rate_limit_per_minute }}/min</span>
            </template>
          </Column>
          <Column header="Latencia">
            <template #body="{ data }: { data: DashboardWebhookHealth }">
              {{ formatDuration(data.avg_duration_ms) }}
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ═══════════════════════════════════════════════════════
           SECTION 2: Events Log
           ═══════════════════════════════════════════════════════ -->

      <div class="border-t pt-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Registro de Eventos</h2>

        <!-- Filters -->
        <div class="flex gap-4 mb-4">
          <Dropdown
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Estado"
            class="w-48"
            @change="onFilterChange"
          />
          <Dropdown
            v-model="typeFilter"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tipo de evento"
            class="w-56"
            @change="onFilterChange"
          />
        </div>

        <!-- Loading -->
        <div v-if="store.eventsLoading" class="flex justify-center py-12">
          <i class="pi pi-spinner pi-spin text-4xl text-primary" />
        </div>

        <!-- Empty -->
        <AppEmptyState
          v-else-if="!store.events.length"
          title="Sin eventos"
          description="Los eventos aparecerán aquí cuando se creen órdenes, clientes o se actualicen productos"
        />

        <!-- Table -->
        <DataTable
          v-else
          :value="store.events"
          :paginator="true"
          :rows="20"
          :totalRecords="store.eventsMeta?.total ?? 0"
          :lazy="true"
          @page="onPage"
          stripedRows
          class="text-sm"
        >
          <Column header="ID" field="id" style="width: 70px">
            <template #body="{ data }">
              <span class="text-gray-500 font-mono">#{{ data.id }}</span>
            </template>
          </Column>
          <Column header="Tipo" field="event_type">
            <template #body="{ data }">
              <span class="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{{ data.event_type }}</span>
            </template>
          </Column>
          <Column header="Recurso">
            <template #body="{ data }">
              <span class="text-gray-600">{{ data.aggregate_type }} #{{ data.aggregate_id }}</span>
            </template>
          </Column>
          <Column header="Estado">
            <template #body="{ data }">
              <AppBadge :variant="getStatusVariant(data.status)">
                {{ getStatusLabel(data.status) }}
              </AppBadge>
            </template>
          </Column>
          <Column header="Fecha">
            <template #body="{ data }">
              {{ new Date(data.created_at).toLocaleString('es-PE') }}
            </template>
          </Column>
          <Column header="Acciones" style="width: 100px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <AppButton variant="text" size="small" @click="openDetail(data)" title="Ver detalle">
                  <i class="pi pi-eye" />
                </AppButton>
                <AppButton
                  v-if="data.status === 'failed' || data.status === 'dead_letter'"
                  variant="text"
                  size="small"
                  @click="retryEvent(data)"
                  title="Reintentar"
                >
                  <i class="pi pi-replay text-orange-500" />
                </AppButton>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Empty state when no data at all -->
      <div
        v-if="!providerStats.length && !webhookHealth.length && !alerts.length && (summary?.today ?? 0) === 0 && !store.events.length"
        class="text-center py-12 text-gray-400"
      >
        <i class="pi pi-chart-bar text-4xl mb-3" />
        <p class="text-lg">Sin datos de monitoreo</p>
        <p class="text-sm mt-1">Las metricas apareceran cuando se procesen eventos</p>
      </div>
    </template>

    <!-- Event Detail Dialog -->
    <Dialog
      v-model:visible="showDetail"
      header="Detalle del evento"
      :style="{ width: '700px' }"
      modal
    >
      <div v-if="detailLoading" class="flex justify-center py-8">
        <i class="pi pi-spinner pi-spin text-2xl text-primary" />
      </div>
      <template v-else-if="selectedEvent">
        <div class="space-y-4">
          <!-- Meta -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Tipo:</span>
              <span class="ml-2 font-mono">{{ selectedEvent.event_type }}</span>
            </div>
            <div>
              <span class="text-gray-500">Estado:</span>
              <AppBadge :variant="getStatusVariant(selectedEvent.status)" class="ml-2">
                {{ getStatusLabel(selectedEvent.status) }}
              </AppBadge>
            </div>
            <div>
              <span class="text-gray-500">Creado:</span>
              <span class="ml-2">{{ new Date(selectedEvent.created_at).toLocaleString('es-PE') }}</span>
            </div>
            <div>
              <span class="text-gray-500">Procesado:</span>
              <span class="ml-2">{{ selectedEvent.processed_at ? new Date(selectedEvent.processed_at).toLocaleString('es-PE') : '-' }}</span>
            </div>
            <div v-if="selectedEvent.retry_count > 0">
              <span class="text-gray-500">Reintentos:</span>
              <span class="ml-2 text-orange-600 font-medium">{{ selectedEvent.retry_count }}</span>
            </div>
            <div v-if="selectedEvent.dead_letter_at">
              <span class="text-gray-500">Dead letter:</span>
              <span class="ml-2 text-red-600">{{ new Date(selectedEvent.dead_letter_at).toLocaleString('es-PE') }}</span>
            </div>
          </div>

          <!-- Payload -->
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">Payload</h4>
            <pre class="bg-gray-800 text-green-400 text-xs p-4 rounded overflow-auto max-h-64">{{ JSON.stringify(selectedEvent.payload, null, 2) }}</pre>
          </div>

          <!-- Webhook Deliveries -->
          <div v-if="selectedEvent.deliveries?.length">
            <h4 class="font-semibold text-gray-700 mb-2">Entregas webhook ({{ selectedEvent.deliveries.length }})</h4>
            <div v-for="d in selectedEvent.deliveries" :key="d.id" class="border rounded p-3 mb-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs truncate max-w-xs">{{ d.url }}</span>
                <AppBadge :variant="d.status === 'success' ? 'success' : 'danger'">
                  HTTP {{ d.response_code || 'Error' }}
                </AppBadge>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ d.duration_ms }}ms - {{ new Date(d.created_at).toLocaleString('es-PE') }}
              </div>
            </div>
          </div>

          <!-- Adapter Deliveries -->
          <div v-if="selectedEvent.adapter_deliveries?.length">
            <h4 class="font-semibold text-gray-700 mb-2">Entregas a proveedores ({{ selectedEvent.adapter_deliveries.length }})</h4>
            <div v-for="ad in selectedEvent.adapter_deliveries" :key="ad.id" class="border rounded p-3 mb-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-medium capitalize">{{ ad.provider }}</span>
                <AppBadge :variant="ad.status === 'success' ? 'success' : 'danger'">
                  {{ ad.status === 'success' ? 'Exitoso' : 'Fallido' }}
                </AppBadge>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                <span v-if="ad.duration_ms">{{ ad.duration_ms }}ms - </span>
                {{ new Date(ad.created_at).toLocaleString('es-PE') }}
              </div>
              <div v-if="ad.error_message" class="text-xs text-red-500 mt-1 truncate" :title="ad.error_message">
                {{ ad.error_message }}
              </div>
            </div>
          </div>
        </div>

        <template v-if="selectedEvent.status === 'failed' || selectedEvent.status === 'dead_letter'">
          <div class="mt-4 pt-4 border-t flex justify-end">
            <AppButton variant="primary" @click="retryEvent(selectedEvent!)">
              <i class="pi pi-replay mr-2" />
              Reintentar
            </AppButton>
          </div>
        </template>
      </template>
    </Dialog>
  </div>
</template>
