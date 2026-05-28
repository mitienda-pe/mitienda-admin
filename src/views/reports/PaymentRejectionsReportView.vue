<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Análisis de Rechazos</h1>
      <p class="text-secondary-600 mt-1">
        Tasa de rechazo por pasarela y desglose por motivo, marca y banco.
      </p>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Rango de fechas</label>
            <Calendar
              v-model="dateRange"
              selectionMode="range"
              :showIcon="true"
              :manualInput="false"
              dateFormat="dd/mm/yy"
              class="w-full"
              :maxDate="today"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Pasarela</label>
            <Dropdown
              v-model="filters.payment_gateway_id"
              :options="gatewayOptions"
              optionLabel="name"
              optionValue="id"
              placeholder="Todas"
              class="w-full"
              :loading="loadingGateways"
              :showClear="true"
            />
          </div>

          <div class="md:col-span-2 flex gap-2 justify-end">
            <AppButton
              variant="secondary"
              :disabled="loading"
              @click="resetFilters"
            >
              Limpiar
            </AppButton>
            <AppButton
              variant="primary"
              :loading="loading"
              @click="loadReport"
            >
              Aplicar
            </AppButton>
          </div>
        </div>
      </template>
    </Card>

    <!-- Loading -->
    <div v-if="loading && !report" class="flex justify-center py-16">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-8">
      <AppErrorState
        title="Error al cargar el reporte"
        :message="error"
        @retry="loadReport"
      />
    </div>

    <!-- Empty -->
    <div v-else-if="report && report.summary.total_attempts === 0" class="py-8">
      <AppEmptyState
        icon="pi-inbox"
        title="Sin intentos de pago en el rango"
        message="Ajusta el rango de fechas o la pasarela seleccionada."
      />
    </div>

    <!-- Content -->
    <div v-else-if="report" class="space-y-6">
      <!-- Scorecards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <template #content>
            <div class="text-sm text-secondary-600">Intentos totales</div>
            <div class="text-2xl font-bold text-secondary-900 mt-1">
              {{ report.summary.total_attempts.toLocaleString('es-PE') }}
            </div>
            <div class="text-xs text-secondary-500 mt-1">
              Excluye carritos sin pago iniciado
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-sm text-secondary-600">Aprobados</div>
            <div class="text-2xl font-bold text-emerald-600 mt-1">
              {{ report.summary.approved.toLocaleString('es-PE') }}
            </div>
            <div class="text-xs text-secondary-500 mt-1">
              {{ approvedPct }}% del total
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-sm text-secondary-600">Rechazados</div>
            <div class="text-2xl font-bold text-red-600 mt-1">
              {{ report.summary.rejected.toLocaleString('es-PE') }}
            </div>
            <div class="text-xs text-secondary-500 mt-1">
              {{ report.summary.rejection_rate_pct }}% de rechazo
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-sm text-secondary-600">Monto rechazado</div>
            <div class="text-2xl font-bold text-secondary-900 mt-1">
              S/ {{ formatAmount(report.summary.rejected_amount) }}
            </div>
            <div class="text-xs text-secondary-500 mt-1">
              {{ report.summary.pending }} pendientes · {{ report.summary.expired }} expirados
            </div>
          </template>
        </Card>
      </div>

      <!-- Charts: reasons + brands -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-red-500"></i>
              <span>Motivos de rechazo</span>
            </div>
          </template>
          <template #content>
            <div v-if="!report.by_reason.length" class="text-center text-secondary-400 py-12">
              Sin datos
            </div>
            <v-chart
              v-else
              :option="reasonsChart"
              :autoresize="true"
              style="height: 320px"
            />
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-credit-card text-primary"></i>
              <span>Marca de tarjeta</span>
            </div>
          </template>
          <template #content>
            <div
              v-if="!hasBrandData"
              class="flex flex-col items-center text-center text-secondary-500 py-8"
            >
              <i class="pi pi-info-circle text-3xl text-secondary-400 mb-2"></i>
              <p class="text-sm">
                Aún no hay rechazos con marca registrada en este rango.
              </p>
              <p class="text-xs text-secondary-400 mt-1">
                La captura de marca/banco en rechazos se habilitó recientemente — los datos
                aparecerán a medida que se procesen nuevos pagos.
              </p>
            </div>
            <v-chart
              v-else
              :option="brandsChart"
              :autoresize="true"
              style="height: 320px"
            />
          </template>
        </Card>
      </div>

      <!-- By gateway table -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-server text-primary"></i>
            <span>Tasa de rechazo por pasarela</span>
          </div>
        </template>
        <template #content>
          <DataTable
            :value="report.by_gateway"
            :stripedRows="true"
            class="text-sm"
            sortField="attempts"
            :sortOrder="-1"
          >
            <Column field="gateway_name" header="Pasarela" sortable />
            <Column field="attempts" header="Intentos" sortable bodyStyle="text-align: right">
              <template #body="{ data }">
                {{ data.attempts.toLocaleString('es-PE') }}
              </template>
            </Column>
            <Column field="approved" header="Aprobados" sortable bodyStyle="text-align: right">
              <template #body="{ data }">
                <span class="text-emerald-600">{{ data.approved.toLocaleString('es-PE') }}</span>
              </template>
            </Column>
            <Column field="rejected" header="Rechazados" sortable bodyStyle="text-align: right">
              <template #body="{ data }">
                <span class="text-red-600">{{ data.rejected.toLocaleString('es-PE') }}</span>
              </template>
            </Column>
            <Column
              field="rejection_rate_pct"
              header="% rechazo"
              sortable
              bodyStyle="text-align: right"
            >
              <template #body="{ data }">
                <AppBadge :variant="rateVariant(data.rejection_rate_pct)">
                  {{ data.rejection_rate_pct.toFixed(1) }}%
                </AppBadge>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Detail tables: reasons + banks -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <template #title>
            <span>Motivos · top 10</span>
          </template>
          <template #content>
            <DataTable :value="report.by_reason.slice(0, 10)" class="text-sm" :stripedRows="true">
              <Column field="reason" header="Motivo">
                <template #body="{ data }">
                  <span class="break-words">{{ data.reason }}</span>
                </template>
              </Column>
              <Column field="total" header="Casos" bodyStyle="text-align: right; width: 90px">
                <template #body="{ data }">
                  <span class="font-semibold">{{ data.total }}</span>
                </template>
              </Column>
              <Column header="%" bodyStyle="text-align: right; width: 60px">
                <template #body="{ data }">
                  {{ pctOfRejected(data.total) }}%
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <Card>
          <template #title>
            <span>Banco emisor · top 10</span>
          </template>
          <template #content>
            <div
              v-if="!hasBankData"
              class="flex flex-col items-center text-center text-secondary-500 py-8"
            >
              <i class="pi pi-info-circle text-3xl text-secondary-400 mb-2"></i>
              <p class="text-sm">
                Sin datos de banco en este rango.
              </p>
              <p class="text-xs text-secondary-400 mt-1">
                Solo algunas pasarelas (Openpay, Culqi, MercadoPago, Izipay) devuelven banco
                emisor — comenzarán a llenarse cuando se procesen rechazos nuevos.
              </p>
            </div>
            <DataTable
              v-else
              :value="report.by_bank.slice(0, 10)"
              class="text-sm"
              :stripedRows="true"
            >
              <Column field="bank" header="Banco" />
              <Column field="total" header="Casos" bodyStyle="text-align: right; width: 90px">
                <template #body="{ data }">
                  <span class="font-semibold">{{ data.total }}</span>
                </template>
              </Column>
              <Column header="%" bodyStyle="text-align: right; width: 60px">
                <template #body="{ data }">
                  {{ pctOfRejected(data.total) }}%
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>

      <!-- Daily trend -->
      <Card>
        <template #title>
          <span>Tendencia diaria · aprobados vs rechazados</span>
        </template>
        <template #content>
          <v-chart
            :option="dailyChart"
            :autoresize="true"
            style="height: 280px"
          />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { AppBadge, AppButton, AppEmptyState, AppErrorState } from '@/components/ui'
import reportsApi from '@/api/reports.api'
import type {
  PaymentGateway,
  PaymentRejectionsFilters,
  PaymentRejectionsResponse
} from '@/types/report.types'

use([PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const toast = useToast()
const today = new Date()

const COLORS = ['#ef4444', '#f59e0b', '#0ea5e9', '#8b5cf6', '#10b981', '#f97316', '#6366f1', '#ec4899', '#14b8a6', '#84cc16']
const BRAND_COLORS = ['#00b2a6', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#6366f1']

// State
const filters = ref<PaymentRejectionsFilters>({})
const dateRange = ref<Date[]>(defaultDateRange())
const gatewayOptions = ref<PaymentGateway[]>([])
const loadingGateways = ref(false)
const report = ref<PaymentRejectionsResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

function defaultDateRange(): Date[] {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return [from, to]
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const approvedPct = computed(() => {
  if (!report.value || report.value.summary.total_attempts === 0) return '0.0'
  return ((100 * report.value.summary.approved) / report.value.summary.total_attempts).toFixed(1)
})

const hasBrandData = computed(() => {
  if (!report.value) return false
  return report.value.by_brand.some((b) => b.brand !== 'Sin marca')
})

const hasBankData = computed(() => {
  if (!report.value) return false
  return report.value.by_bank.some((b) => b.bank !== 'Sin banco')
})

const reasonsChart = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}<br/>{c} casos ({d}%)' },
  legend: {
    orient: 'vertical',
    right: 0,
    top: 'center',
    textStyle: { fontSize: 11 },
    type: 'scroll'
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['32%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      data: (report.value?.by_reason ?? []).slice(0, 8).map((r, i) => ({
        name: truncate(r.reason ?? '', 40),
        value: r.total,
        itemStyle: { color: COLORS[i % COLORS.length] }
      }))
    }
  ]
}))

const brandsChart = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}<br/>{c} casos ({d}%)' },
  legend: {
    orient: 'vertical',
    right: 0,
    top: 'center',
    textStyle: { fontSize: 12 }
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['32%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      data: (report.value?.by_brand ?? [])
        .filter((b) => b.brand !== 'Sin marca')
        .map((b, i) => ({
          name: b.brand ?? '',
          value: b.total,
          itemStyle: { color: BRAND_COLORS[i % BRAND_COLORS.length] }
        }))
    }
  ]
}))

const dailyChart = computed(() => {
  const days = report.value?.by_day ?? []
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Aprobados', 'Rechazados'], top: 0 },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: days.map((d) => d.day),
      axisLabel: { fontSize: 10, rotate: 45 }
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Aprobados',
        type: 'bar',
        stack: 'total',
        data: days.map((d) => d.approved),
        itemStyle: { color: '#10b981' }
      },
      {
        name: 'Rechazados',
        type: 'bar',
        stack: 'total',
        data: days.map((d) => d.rejected),
        itemStyle: { color: '#ef4444' }
      }
    ]
  }
})

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.substring(0, n - 1) + '…'
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function pctOfRejected(total: number): string {
  if (!report.value || report.value.summary.rejected === 0) return '0.0'
  return ((100 * total) / report.value.summary.rejected).toFixed(1)
}

function rateVariant(rate: number): 'success' | 'warning' | 'danger' | 'neutral' {
  if (rate < 10) return 'success'
  if (rate < 25) return 'warning'
  return 'danger'
}

function resetFilters() {
  dateRange.value = defaultDateRange()
  filters.value = {}
  loadReport()
}

async function loadGateways() {
  try {
    loadingGateways.value = true
    gatewayOptions.value = await reportsApi.getPaymentGateways()
  } catch (e) {
    console.error('Error loading gateways:', e)
  } finally {
    loadingGateways.value = false
  }
}

async function loadReport() {
  if (!dateRange.value || !dateRange.value[0]) {
    toast.add({
      severity: 'warn',
      summary: 'Rango inválido',
      detail: 'Selecciona un rango de fechas',
      life: 3000
    })
    return
  }

  loading.value = true
  error.value = null

  try {
    const payload: PaymentRejectionsFilters = {
      date_from: toIsoDate(dateRange.value[0]),
      date_to: dateRange.value[1] ? toIsoDate(dateRange.value[1]) : toIsoDate(dateRange.value[0])
    }
    if (filters.value.payment_gateway_id) {
      payload.payment_gateway_id = filters.value.payment_gateway_id
    }
    report.value = await reportsApi.getPaymentRejections(payload)
  } catch (e) {
    console.error('Error loading rejection report:', e)
    error.value = e instanceof Error ? e.message : 'Error desconocido'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadGateways()
  await loadReport()
})
</script>
