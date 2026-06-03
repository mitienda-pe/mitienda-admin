<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Redondeo POS</h1>
      <p class="text-secondary-600 mt-1">
        Ganancia y pérdida por redondeo de efectivo en el punto de venta.
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

          <div class="md:col-span-3 flex gap-2 justify-end">
            <AppButton variant="secondary" :disabled="loading" @click="resetFilters">
              Limpiar
            </AppButton>
            <AppButton variant="primary" :loading="loading" @click="loadReport">
              Aplicar
            </AppButton>
          </div>
        </div>
      </template>
    </Card>

    <!-- Info note -->
    <div class="mb-6 flex items-start gap-2 rounded-lg bg-secondary-50 border border-secondary-200 p-4 text-sm text-secondary-600">
      <i class="pi pi-info-circle text-primary mt-0.5"></i>
      <p>
        La venta se registra por el monto original; el redondeo es la diferencia con el efectivo
        cobrado. Para tiendas integradas con NetSuite, este redondeo ya se contabiliza como asiento
        separado. Este reporte da visibilidad local del impacto acumulado.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading && !report" class="flex justify-center py-16">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-8">
      <AppErrorState title="Error al cargar el reporte" :message="error" @retry="loadReport" />
    </div>

    <!-- Empty -->
    <div v-else-if="report && report.summary.cantidad === 0" class="py-8">
      <AppEmptyState
        icon="pi-money-bill"
        title="Sin redondeos en el rango"
        message="No hay ventas con redondeo aplicado en las fechas seleccionadas."
      />
    </div>

    <!-- Content -->
    <div v-else-if="report" class="space-y-6">
      <!-- Scorecards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <template #content>
            <div class="text-sm text-secondary-600">Ventas con redondeo</div>
            <div class="text-2xl font-bold text-secondary-900 mt-1">
              {{ report.summary.cantidad.toLocaleString('es-PE') }}
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-sm text-secondary-600">Ganancia por redondeo</div>
            <div class="text-2xl font-bold text-emerald-600 mt-1">
              S/ {{ formatAmount(report.summary.ganancia_redondeo) }}
            </div>
            <div class="text-xs text-secondary-500 mt-1">A favor del negocio</div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-sm text-secondary-600">Pérdida por redondeo</div>
            <div class="text-2xl font-bold text-red-600 mt-1">
              S/ {{ formatAmount(report.summary.perdida_redondeo) }}
            </div>
            <div class="text-xs text-secondary-500 mt-1">En contra del negocio</div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="text-sm text-secondary-600">Neto</div>
            <div class="text-2xl font-bold mt-1" :class="report.summary.neto >= 0 ? 'text-emerald-600' : 'text-red-600'">
              S/ {{ formatAmount(report.summary.neto) }}
            </div>
            <div class="text-xs text-secondary-500 mt-1">
              Ventas S/ {{ formatAmount(report.summary.total_ventas_registradas) }} ·
              Cobrado S/ {{ formatAmount(report.summary.total_efectivo_cobrado) }}
            </div>
          </template>
        </Card>
      </div>

      <!-- Daily trend -->
      <Card>
        <template #title>
          <span>Tendencia diaria · neto por redondeo</span>
        </template>
        <template #content>
          <v-chart :option="dailyChart" :autoresize="true" style="height: 280px" />
        </template>
      </Card>

      <!-- Daily detail table -->
      <Card>
        <template #title>
          <span>Detalle por día</span>
        </template>
        <template #content>
          <DataTable
            :value="report.by_day"
            :stripedRows="true"
            class="text-sm"
            sortField="fecha"
            :sortOrder="-1"
          >
            <Column field="fecha" header="Fecha" sortable />
            <Column field="cantidad" header="Ventas" sortable bodyStyle="text-align: right">
              <template #body="{ data }">
                {{ data.cantidad.toLocaleString('es-PE') }}
              </template>
            </Column>
            <Column field="ganancia_redondeo" header="Ganancia" sortable bodyStyle="text-align: right">
              <template #body="{ data }">
                <span class="text-emerald-600">S/ {{ formatAmount(data.ganancia_redondeo) }}</span>
              </template>
            </Column>
            <Column field="perdida_redondeo" header="Pérdida" sortable bodyStyle="text-align: right">
              <template #body="{ data }">
                <span class="text-red-600">S/ {{ formatAmount(data.perdida_redondeo) }}</span>
              </template>
            </Column>
            <Column field="neto" header="Neto" sortable bodyStyle="text-align: right">
              <template #body="{ data }">
                <span :class="data.neto >= 0 ? 'text-emerald-600' : 'text-red-600'">
                  S/ {{ formatAmount(data.neto) }}
                </span>
              </template>
            </Column>
          </DataTable>
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
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { AppButton, AppEmptyState, AppErrorState } from '@/components/ui'
import reportsApi from '@/api/reports.api'
import type { RoundingReportFilters, RoundingReportResponse } from '@/types/report.types'

use([BarChart, TooltipComponent, GridComponent, CanvasRenderer])

const toast = useToast()
const today = new Date()

const dateRange = ref<Date[]>(defaultDateRange())
const report = ref<RoundingReportResponse | null>(null)
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

function formatAmount(amount: number): string {
  return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const dailyChart = computed(() => {
  const days = [...(report.value?.by_day ?? [])].reverse()
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: days.map((d) => d.fecha),
      axisLabel: { fontSize: 10, rotate: 45 }
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Neto',
        type: 'bar',
        data: days.map((d) => ({
          value: d.neto,
          itemStyle: { color: d.neto >= 0 ? '#10b981' : '#ef4444' }
        }))
      }
    ]
  }
})

function resetFilters() {
  dateRange.value = defaultDateRange()
  loadReport()
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
    const payload: RoundingReportFilters = {
      date_from: toIsoDate(dateRange.value[0]),
      date_to: dateRange.value[1] ? toIsoDate(dateRange.value[1]) : toIsoDate(dateRange.value[0])
    }
    report.value = await reportsApi.getRoundingSummary(payload)
  } catch (e) {
    console.error('Error loading rounding report:', e)
    error.value = e instanceof Error ? e.message : 'Error desconocido'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadReport()
})
</script>
