<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useWebhookSubscriptionsStore } from '@/stores/webhookSubscriptions.store'
import { AppButton, AppBadge, AppErrorState } from '@/components/ui'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type {
  DashboardProviderStat,
  DashboardWebhookHealth,
  DashboardAlert
} from '@/types/webhook-subscriptions.types'

const store = useWebhookSubscriptionsStore()

onMounted(() => {
  store.fetchDashboard()
})

const summary = computed(() => store.dashboardData?.summary)
const providerStats = computed(() => store.dashboardData?.provider_stats ?? [])
const webhookHealth = computed(() => store.dashboardData?.webhook_health ?? [])
const alerts = computed(() => store.dashboardData?.alerts ?? [])

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
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Monitor de Integraciones</h1>
        <p class="text-gray-500 mt-1">Observabilidad de eventos, proveedores y webhooks</p>
      </div>
      <AppButton variant="secondary" @click="store.fetchDashboard()">
        <i class="pi pi-refresh mr-2" />
        Actualizar
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="store.dashboardLoading" class="flex justify-center py-16">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <AppErrorState v-else-if="store.error && !store.dashboardData" :message="store.error" @retry="store.fetchDashboard()" />

    <!-- Content -->
    <template v-else-if="store.dashboardData">
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
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border rounded-lg p-4">
          <div class="text-sm text-gray-500">Eventos hoy</div>
          <div class="text-2xl font-bold text-gray-800">{{ summary?.today ?? 0 }}</div>
        </div>
        <div class="bg-white border rounded-lg p-4">
          <div class="text-sm text-gray-500">Tasa de exito (7d)</div>
          <div class="text-2xl font-bold" :class="{
            'text-green-600': (summary?.success_rate ?? 100) >= 95,
            'text-yellow-600': (summary?.success_rate ?? 100) >= 80 && (summary?.success_rate ?? 100) < 95,
            'text-red-600': (summary?.success_rate ?? 100) < 80
          }">
            {{ summary?.success_rate ?? 100 }}%
          </div>
        </div>
        <div class="bg-white border rounded-lg p-4">
          <div class="text-sm text-gray-500">Cola pendiente</div>
          <div class="text-2xl font-bold" :class="(summary?.queue_depth ?? 0) > 50 ? 'text-yellow-600' : 'text-gray-800'">
            {{ summary?.queue_depth ?? 0 }}
          </div>
          <div v-if="summary?.oldest_pending_at" class="text-xs text-gray-400 mt-1">
            Desde {{ formatDate(summary.oldest_pending_at) }}
          </div>
        </div>
        <div class="bg-white border rounded-lg p-4">
          <div class="text-sm text-gray-500">Por estado</div>
          <div class="flex flex-wrap gap-1 mt-1">
            <template v-for="stat in summary?.by_status" :key="stat.status">
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
      <div v-if="webhookHealth.length">
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

      <!-- Empty state when no data at all -->
      <div
        v-if="!providerStats.length && !webhookHealth.length && !alerts.length && (summary?.today ?? 0) === 0"
        class="text-center py-12 text-gray-400"
      >
        <i class="pi pi-chart-bar text-4xl mb-3" />
        <p class="text-lg">Sin datos de monitoreo</p>
        <p class="text-sm mt-1">Las metricas apareceran cuando se procesen eventos</p>
      </div>
    </template>
  </div>
</template>
