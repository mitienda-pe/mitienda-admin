<template>
  <div class="container mx-auto py-6 px-4">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-secondary-900 mb-2">
        Reporte de Ventas por Producto
      </h1>
      <p class="text-secondary-600">
        Exporta el detalle de ventas por producto en formato CSV o Excel
      </p>
    </div>

    <!-- Filters Card -->
    <ReportFiltersCard
      :filters="filters"
      :payment-gateways="paymentGateways"
      :loading-gateways="loadingGateways"
      @update:filters="handleUpdateFilters"
      @apply="handleApplyFilters"
    />

    <!-- Preview Results -->
    <Card v-if="previewData.length > 0" class="mb-6">
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="pi pi-eye text-primary"></i>
            <span>Vista Previa</span>
            <span class="text-sm text-secondary-600 font-normal">
              (Primeros {{ previewData.length }} de {{ totalCount }} registros)
            </span>
          </div>
          <ExportButton
            :has-data="previewData.length > 0"
            @export="handleExport"
          />
        </div>
      </template>
      <template #content>
        <div class="overflow-x-auto">
          <DataTable
            :value="previewData"
            stripedRows
            responsiveLayout="scroll"
            :loading="loadingPreview"
            class="text-sm"
          >
            <Column field="order_code" header="Código Pedido" style="min-width: 120px"></Column>
            <Column field="order_date" header="Fecha" style="min-width: 150px">
              <template #body="{ data }">
                {{ formatDate(data.order_date) }}
              </template>
            </Column>
            <Column field="customer_name" header="Cliente" style="min-width: 180px"></Column>
            <Column field="product_code" header="Código Producto" style="min-width: 130px"></Column>
            <Column field="product_name" header="Producto" style="min-width: 200px"></Column>
            <Column field="product_quantity" header="Cantidad" style="min-width: 90px">
              <template #body="{ data }">
                <span class="font-medium">{{ data.product_quantity }}</span>
              </template>
            </Column>
            <Column field="product_unit_price" header="Precio Unit." style="min-width: 110px">
              <template #body="{ data }">
                {{ data.currency }} {{ formatNumber(data.product_unit_price) }}
              </template>
            </Column>
            <Column field="product_discount" header="Descuento" style="min-width: 110px">
              <template #body="{ data }">
                {{ data.currency }} {{ formatNumber(data.product_discount) }}
              </template>
            </Column>
            <Column field="product_total" header="Total Producto" style="min-width: 130px">
              <template #body="{ data }">
                <span class="font-medium">{{ data.currency }} {{ formatNumber(data.product_total) }}</span>
              </template>
            </Column>
            <Column field="promotion_name" header="Promoción" style="min-width: 150px">
              <template #body="{ data }">
                <span v-if="data.promotion_name" class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  {{ data.promotion_name }}
                </span>
                <span v-else class="text-secondary-400">-</span>
              </template>
            </Column>
            <Column field="payment_status" header="Estado Pago" style="min-width: 120px">
              <template #body="{ data }">
                <AppBadge :severity="getPaymentStatusSeverity(data.payment_status)">
                  {{ data.payment_status }}
                </AppBadge>
              </template>
            </Column>
            <Column field="total" header="Total Pedido" style="min-width: 130px">
              <template #body="{ data }">
                <span class="font-bold">{{ data.currency }} {{ formatNumber(data.total) }}</span>
              </template>
            </Column>
          </DataTable>
        </div>

        <div v-if="hasMore" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-blue-600 mt-1"></i>
            <div>
              <p class="text-sm text-blue-900 font-medium mb-1">
                Esta es una vista previa de los primeros {{ previewData.length }} registros
              </p>
              <p class="text-sm text-blue-700">
                El reporte completo contiene {{ totalCount }} registros. Usa el botón "Exportar" para descargar todos los datos.
              </p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Empty State -->
    <AppEmptyState
      v-if="!loadingPreview && previewData.length === 0 && filtersApplied"
      title="No se encontraron resultados"
      description="Intenta ajustar los filtros de búsqueda"
      icon="pi pi-search"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { AppBadge, AppEmptyState } from '@/components/ui'
import ReportFiltersCard from '@/components/reports/ReportFiltersCard.vue'
import ExportButton from '@/components/reports/ExportButton.vue'
import { reportsApi } from '@/api/reports.api'
import type {
  ReportFilters,
  ProductSalesReportRow,
  PaymentGateway,
  ExportFormat
} from '@/types/report.types'

const toast = useToast()

// State
const filters = ref<ReportFilters>({})
const previewData = ref<ProductSalesReportRow[]>([])
const totalCount = ref(0)
const hasMore = ref(false)
const filtersApplied = ref(false)
const loadingPreview = ref(false)
const loadingGateways = ref(false)
const paymentGateways = ref<PaymentGateway[]>([])

// Lifecycle
onMounted(async () => {
  await loadPaymentGateways()
})

// Methods
const loadPaymentGateways = async () => {
  try {
    loadingGateways.value = true
    paymentGateways.value = await reportsApi.getPaymentGateways()
  } catch (error) {
    console.error('Error loading payment gateways:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las pasarelas de pago',
      life: 3000
    })
  } finally {
    loadingGateways.value = false
  }
}

const handleUpdateFilters = (newFilters: ReportFilters) => {
  filters.value = newFilters
}

const handleApplyFilters = async () => {
  try {
    loadingPreview.value = true
    filtersApplied.value = true

    const response = await reportsApi.getProductSalesReportPreview(filters.value)

    previewData.value = response.data
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
    console.error('Error loading report preview:', error)
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
  try {
    toast.add({
      severity: 'info',
      summary: 'Generando reporte',
      detail: 'Por favor espera mientras se genera el archivo...',
      life: 3000
    })

    const blob = await reportsApi.exportProductSalesReport(filters.value, format)

    // Generate filename
    const dateFrom = filters.value.date_from?.replace(/-/g, '') || ''
    const dateTo = filters.value.date_to?.replace(/-/g, '') || ''
    const extension = format === 'csv' ? 'csv' : 'xlsx'
    const filename = `reporte_ventas_productos_${dateFrom}_${dateTo}.${extension}`

    reportsApi.downloadFile(blob, filename)

    toast.add({
      severity: 'success',
      summary: 'Exportación exitosa',
      detail: 'El reporte se ha descargado correctamente',
      life: 3000
    })
  } catch (error) {
    console.error('Error exporting report:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo exportar el reporte',
      life: 3000
    })
  }
}

// Helpers
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const getPaymentStatusSeverity = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
  if (status === 'Aprobado') return 'success'
  if (status === 'Pendiente') return 'warning'
  if (status === 'Rechazado') return 'danger'
  return 'info'
}
</script>
