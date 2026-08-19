<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-secondary-900">Reporte SIRE</h1>
        <p class="text-secondary-600 mt-1">
          Registro de Ventas e Ingresos: un comprobante por fila, para conciliar con la propuesta
          de SUNAT.
        </p>
      </div>

      <ExportButton
        :loading="exporting"
        :has-data="hasData"
        :default-format="ExportFormat.XLSX"
        @export="handleExport"
      />
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Periodo (fecha de emisión)
            </label>
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
              Mes anterior
            </AppButton>
            <AppButton variant="primary" :loading="loading" @click="loadReport">
              Aplicar
            </AppButton>
          </div>
        </div>
      </template>
    </Card>

    <!-- Info note -->
    <div
      class="mb-6 flex items-start gap-2 rounded-lg bg-secondary-50 border border-secondary-200 p-4 text-sm text-secondary-600"
    >
      <i class="pi pi-info-circle text-primary mt-0.5"></i>
      <p>
        En la propuesta del SIRE las boletas aparecen sin el nombre del cliente: se informan a
        SUNAT por resumen diario, y ese formato solo transporta el tipo y número de documento. El
        nombre sí viaja en el comprobante electrónico, y es el que ves acá. Los comprobantes se
        agrupan por <strong>fecha de emisión</strong>, no por fecha de venta.
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
    <div v-else-if="report && report.total_count === 0" class="py-8">
      <AppEmptyState
        icon="pi-file"
        title="Sin comprobantes en el periodo"
        message="No se emitieron facturas ni boletas con fecha de emisión dentro del rango seleccionado."
      />
    </div>

    <!-- Content -->
    <div v-else-if="report" class="space-y-6">
      <!-- Totales del periodo -->
      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <template #content>
            <div class="text-sm text-secondary-600">Comprobantes</div>
            <div class="text-2xl font-bold text-secondary-900 mt-1">
              {{ report.totals.comprobantes.toLocaleString('es-PE') }}
            </div>
          </template>
        </Card>

        <Card v-for="tile in totalTiles" :key="tile.key">
          <template #content>
            <div class="text-sm text-secondary-600">{{ tile.label }}</div>
            <div class="text-xl font-bold text-secondary-900 mt-1">
              {{ currencySymbol }} {{ formatAmount(tile.value) }}
            </div>
          </template>
        </Card>
      </div>

      <!-- Vista previa -->
      <Card>
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span>Vista previa</span>
            <span v-if="report.has_more" class="text-sm font-normal text-secondary-500">
              Mostrando 100 de {{ report.total_count.toLocaleString('es-PE') }} comprobantes ·
              exporta para verlos todos
            </span>
          </div>
        </template>
        <template #content>
          <DataTable
            :value="report.data"
            :stripedRows="true"
            :scrollable="true"
            scrollHeight="560px"
            class="text-sm"
          >
            <Column
              v-for="column in report.columns"
              :key="column.key"
              :field="column.key"
              :header="column.label"
              :style="`min-width: ${columnWidth(column)}px`"
              :bodyStyle="column.type === 'number' ? 'text-align: right' : undefined"
            >
              <template #body="{ data }">
                <span v-if="column.type === 'number'">
                  {{ formatAmount(data[column.key]) }}
                </span>
                <AppBadge
                  v-else-if="column.key === 'estado'"
                  :label="data.estado"
                  :variant="data.estado === 'Anulado' ? 'danger' : 'success'"
                />
                <span
                  v-else-if="column.key === 'cliente_nombre'"
                  :class="isGenericName(data.cliente_nombre) ? 'text-orange-600' : ''"
                >
                  {{ data.cliente_nombre }}
                </span>
                <span v-else>{{ data[column.key] }}</span>
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
import { AppBadge, AppButton, AppEmptyState, AppErrorState } from '@/components/ui'
import ExportButton from '@/components/reports/ExportButton.vue'
import reportsApi from '@/api/reports.api'
import { ExportFormat } from '@/types/report.types'
import type { SireReportColumn, SireReportPreviewResponse } from '@/types/report.types'
import { useFormatters } from '@/composables/useFormatters'

const { currencySymbol } = useFormatters()
const toast = useToast()
const today = new Date()

const dateRange = ref<Date[]>(previousMonthRange())
const report = ref<SireReportPreviewResponse | null>(null)
const loading = ref(false)
const exporting = ref(false)
const error = ref<string | null>(null)

const hasData = computed(() => (report.value?.total_count ?? 0) > 0)

const totalTiles = computed(() => {
  const totals = report.value?.totals
  if (!totals) return []
  return [
    { key: 'base_gravada', label: 'Base gravada', value: totals.base_gravada },
    { key: 'igv', label: 'IGV', value: totals.igv },
    { key: 'exonerado', label: 'Exonerado', value: totals.exonerado },
    { key: 'inafecto', label: 'Inafecto', value: totals.inafecto },
    { key: 'importe_total', label: 'Importe total', value: totals.importe_total }
  ]
})

/**
 * El mes anterior completo: el periodo que el contador está declarando cuando
 * entra acá. Es el mismo default que aplica la API si no mandamos fechas.
 */
function previousMonthRange(): Date[] {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear(), now.getMonth(), 0)
  return [from, to]
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatAmount(amount: number): string {
  return (amount ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * El ancho de la API viene en caracteres de Excel; acá se traduce a píxeles a
 * ojo para no tener que mantener dos listas de anchos.
 */
function columnWidth(column: SireReportColumn): number {
  return Math.max(90, (column.width ?? 18) * 8)
}

/**
 * Nombres que no identifican a nadie. Se resaltan porque son el hueco real:
 * cuando el cajero no pide el documento, la boleta sale así y no hay reporte
 * que pueda rellenar ese nombre después.
 */
function isGenericName(name: string): boolean {
  return ['cliente', 'cliente general', 'clientes varios', 'varios'].includes(
    (name ?? '').trim().toLowerCase()
  )
}

function currentFilters() {
  if (!dateRange.value?.[0]) return {}
  return {
    date_from: toIsoDate(dateRange.value[0]),
    date_to: dateRange.value[1] ? toIsoDate(dateRange.value[1]) : toIsoDate(dateRange.value[0])
  }
}

function resetFilters() {
  dateRange.value = previousMonthRange()
  loadReport()
}

async function loadReport() {
  loading.value = true
  error.value = null

  try {
    report.value = await reportsApi.getSirePreview(currentFilters())
  } catch (e) {
    console.error('Error loading SIRE report:', e)
    error.value = e instanceof Error ? e.message : 'Error desconocido'
  } finally {
    loading.value = false
  }
}

async function handleExport(format: ExportFormat) {
  exporting.value = true

  try {
    const filters = currentFilters()
    const blob = await reportsApi.exportSireReport(filters, format)
    const period = (filters.date_from ?? '').replace(/-/g, '')

    reportsApi.downloadFile(blob, `sire_registro_ventas_${period}.${format}`)

    toast.add({
      severity: 'success',
      summary: 'Exportado',
      detail: `Reporte SIRE exportado como ${format.toUpperCase()}`,
      life: 3000
    })
  } catch (e) {
    console.error('Error exporting SIRE report:', e)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo exportar el reporte SIRE',
      life: 3000
    })
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadReport()
})
</script>
