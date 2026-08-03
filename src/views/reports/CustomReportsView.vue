<template>
  <div class="container mx-auto py-6 px-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-secondary-900 mb-2">Reportes Personalizados</h1>
      <p class="text-secondary-600">
        Reportes hechos a la medida de tu operación, con el formato que ya usas.
      </p>
    </div>

    <div v-if="loadingReports" class="flex items-center gap-2 text-secondary-600">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Cargando reportes...</span>
    </div>

    <AppEmptyState
      v-else-if="reports.length === 0"
      title="No tienes reportes personalizados"
      description="Los reportes personalizados se habilitan a pedido. Escríbenos si necesitas uno con un formato específico."
      icon="pi pi-file-excel"
    />

    <template v-else>
      <!-- Selector: solo si hay más de uno -->
      <Card v-if="reports.length > 1" class="mb-6">
        <template #content>
          <label for="custom-report" class="block text-sm font-medium text-secondary-700 mb-2">
            Reporte
          </label>
          <Dropdown
            id="custom-report"
            v-model="selectedSlug"
            :options="reports"
            optionLabel="name"
            optionValue="slug"
            class="w-full md:w-1/2"
            @change="handleReportChange"
          />
        </template>
      </Card>

      <div v-if="selectedReport" class="mb-6">
        <h2 class="text-xl font-semibold text-secondary-900">{{ selectedReport.name }}</h2>
        <p v-if="selectedReport.description" class="text-secondary-600 mt-1">
          {{ selectedReport.description }}
        </p>
      </div>

      <ReportFiltersCard
        v-if="selectedReport"
        :filters="filters"
        :payment-gateways="paymentGateways"
        :loading-gateways="loadingGateways"
        :show-payment-status="supportsFilter('payment_status')"
        :show-payment-gateway="supportsFilter('payment_gateway')"
        @update:filters="handleUpdateFilters"
        @apply="handleApplyFilters"
      />

      <Card v-if="previewData.length > 0" class="mb-6">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <i class="pi pi-eye text-primary"></i>
              <span>Vista Previa</span>
              <span class="text-sm text-secondary-600 font-normal">
                (Primeros {{ previewData.length }} de {{ totalCount }} registros)
              </span>
            </div>
            <ExportButton
              :has-data="previewData.length > 0"
              :default-format="ExportFormat.XLSX"
              :loading="exporting"
              @export="handleExport"
            />
          </div>
        </template>
        <template #content>
          <!-- Estos reportes llegan a 39 columnas: el scroll horizontal vive
               dentro de la tabla, no en la página. -->
          <div class="overflow-x-auto">
            <DataTable
              :value="previewData"
              stripedRows
              responsiveLayout="scroll"
              :loading="loadingPreview"
              class="text-sm"
            >
              <Column
                v-for="column in columns"
                :key="column.key"
                :field="column.key"
                :header="column.label"
                :style="columnStyle(column)"
              />
            </DataTable>
          </div>

          <div v-if="hasMore" class="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div class="flex items-start gap-3">
              <i class="pi pi-info-circle text-primary mt-1"></i>
              <div>
                <p class="text-sm text-secondary-700 font-medium mb-1">
                  Esta es una vista previa de los primeros {{ previewData.length }} registros
                </p>
                <p class="text-sm text-primary">
                  El reporte completo contiene {{ totalCount }} registros. Usa "Exportar" para
                  descargar todos los datos.
                </p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <AppEmptyState
        v-if="!loadingPreview && previewData.length === 0 && filtersApplied"
        title="No se encontraron resultados"
        description="Intenta ajustar el rango de fechas"
        icon="pi pi-search"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { AppEmptyState } from '@/components/ui'
import ReportFiltersCard from '@/components/reports/ReportFiltersCard.vue'
import ExportButton from '@/components/reports/ExportButton.vue'
import { customReportsApi } from '@/api/custom-reports.api'
import { reportsApi } from '@/api/reports.api'
import { ExportFormat, type PaymentGateway, type ReportFilters } from '@/types/report.types'
import type {
  CustomReport,
  CustomReportColumn,
  CustomReportFilter,
  CustomReportRow
} from '@/types/custom-report.types'

const toast = useToast()

const reports = ref<CustomReport[]>([])
const selectedSlug = ref<string | null>(null)
const filters = ref<ReportFilters>({})
const previewData = ref<CustomReportRow[]>([])
const columns = ref<CustomReportColumn[]>([])
const totalCount = ref(0)
const hasMore = ref(false)
const filtersApplied = ref(false)
const loadingReports = ref(true)
const loadingPreview = ref(false)
const exporting = ref(false)
const loadingGateways = ref(false)
const paymentGateways = ref<PaymentGateway[]>([])

const selectedReport = computed(
  () => reports.value.find(report => report.slug === selectedSlug.value) ?? null
)

const supportsFilter = (filter: CustomReportFilter): boolean =>
  selectedReport.value?.filters.includes(filter) ?? false

// El ancho declarado está en unidades de columna de Excel; ~8px por unidad da
// una proporción parecida en pantalla.
const columnStyle = (column: CustomReportColumn): string =>
  `min-width: ${Math.max(90, (column.width ?? 18) * 8)}px`

onMounted(async () => {
  await loadReports()
})

const loadReports = async () => {
  try {
    loadingReports.value = true
    reports.value = await customReportsApi.list()

    if (reports.value.length > 0) {
      selectedSlug.value = reports.value[0].slug
      columns.value = reports.value[0].columns
      await loadPaymentGatewaysIfNeeded()
    }
  } catch (error) {
    console.error('Error loading custom reports:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los reportes personalizados',
      life: 3000
    })
  } finally {
    loadingReports.value = false
  }
}

const loadPaymentGatewaysIfNeeded = async () => {
  if (!supportsFilter('payment_gateway') || paymentGateways.value.length > 0) return

  try {
    loadingGateways.value = true
    paymentGateways.value = await reportsApi.getPaymentGateways()
  } catch (error) {
    console.error('Error loading payment gateways:', error)
  } finally {
    loadingGateways.value = false
  }
}

const handleReportChange = async () => {
  previewData.value = []
  totalCount.value = 0
  hasMore.value = false
  filtersApplied.value = false
  columns.value = selectedReport.value?.columns ?? []
  await loadPaymentGatewaysIfNeeded()
}

const handleUpdateFilters = (newFilters: ReportFilters) => {
  filters.value = newFilters
}

const handleApplyFilters = async () => {
  if (!selectedSlug.value) return

  try {
    loadingPreview.value = true
    filtersApplied.value = true

    const response = await customReportsApi.preview(selectedSlug.value, filters.value)

    previewData.value = response.data
    columns.value = response.columns
    totalCount.value = response.total_count
    hasMore.value = response.has_more

    if (response.data.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'Sin resultados',
        detail: 'No se encontraron datos con los filtros aplicados',
        life: 3000
      })
    }
  } catch (error) {
    console.error('Error loading custom report preview:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la vista previa del reporte',
      life: 3000
    })
  } finally {
    loadingPreview.value = false
  }
}

const handleExport = async (format: ExportFormat) => {
  if (!selectedSlug.value) return

  try {
    exporting.value = true
    toast.add({
      severity: 'info',
      summary: 'Generando reporte',
      detail: 'Por favor espera mientras se genera el archivo...',
      life: 3000
    })

    const blob = await customReportsApi.export(selectedSlug.value, filters.value, format)

    const dateFrom = filters.value.date_from?.replace(/-/g, '') ?? ''
    const dateTo = filters.value.date_to?.replace(/-/g, '') ?? ''
    const extension = format === ExportFormat.CSV ? 'csv' : 'xlsx'

    customReportsApi.downloadFile(
      blob,
      `${selectedSlug.value}_${dateFrom}_${dateTo}.${extension}`
    )

    toast.add({
      severity: 'success',
      summary: 'Exportación exitosa',
      detail: 'El reporte se ha descargado correctamente',
      life: 3000
    })
  } catch (error) {
    console.error('Error exporting custom report:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo exportar el reporte',
      life: 3000
    })
  } finally {
    exporting.value = false
  }
}
</script>
