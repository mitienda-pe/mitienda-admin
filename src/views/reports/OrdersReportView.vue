<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Reporte de Pedidos</h1>
      <p class="text-secondary-600 mt-1">
        Exporta y analiza los datos de tus ventas
      </p>
    </div>

    <!-- Filters -->
    <ReportFiltersCard
      :filters="filters"
      :payment-gateways="paymentGateways"
      :loading-gateways="loadingGateways"
      @update:filters="filters = $event"
      @apply="handleApplyFilters"
    />

    <!-- Export Section -->
    <Card v-if="hasAppliedFilters" class="mb-6">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-secondary-900">Exportar Reporte</h3>
            <p class="text-sm text-secondary-600 mt-1">
              {{ previewData?.total_count || 0 }} registros encontrados
              <span v-if="previewData?.has_more" class="text-orange-600">
                (mostrando primeros 100 en la vista previa)
              </span>
            </p>
          </div>

          <ExportButton
            :loading="exporting"
            :has-data="hasPreviewData"
            @export="handleExport"
          />
        </div>
      </template>
    </Card>

    <!-- Preview Table -->
    <Card v-if="hasAppliedFilters">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-eye text-primary"></i>
          <span>Vista Previa</span>
        </div>
      </template>
      <template #content>
        <!-- Loading State -->
        <div v-if="loadingPreview" class="flex justify-center items-center py-12">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="py-8">
          <AppErrorState
            title="Error al cargar el reporte"
            :message="error"
            @retry="handleApplyFilters"
          />
        </div>

        <!-- Empty State -->
        <div v-else-if="!hasPreviewData" class="py-8">
          <AppEmptyState
            icon="pi-inbox"
            title="No se encontraron resultados"
            message="Intenta ajustar los filtros para ver datos"
          />
        </div>

        <!-- Data Table -->
        <DataTable
          v-else
          :value="previewData?.data || []"
          :scrollable="true"
          scrollHeight="500px"
          class="text-sm"
          stripedRows
        >
          <Column field="order_code" header="Código" style="min-width: 120px" frozen>
            <template #body="{ data }">
              <router-link
                :to="`/orders/${data.order_id}`"
                class="text-primary hover:underline font-mono"
              >
                {{ data.order_code }}
              </router-link>
            </template>
          </Column>

          <Column field="order_date" header="Fecha" style="min-width: 150px">
            <template #body="{ data }">
              {{ formatDateTime(data.order_date) }}
            </template>
          </Column>

          <Column field="customer_name" header="Cliente" style="min-width: 200px" />

          <Column field="customer_email" header="Correo" style="min-width: 200px">
            <template #body="{ data }">
              <span class="text-xs">{{ data.customer_email || '-' }}</span>
            </template>
          </Column>

          <Column field="customer_document" header="Documento" style="min-width: 120px">
            <template #body="{ data }">
              {{ data.customer_document || '-' }}
            </template>
          </Column>

          <Column field="payment_status" header="Estado de Pago" style="min-width: 130px">
            <template #body="{ data }">
              <AppBadge
                :label="data.payment_status"
                :variant="getPaymentStatusVariant(data.payment_status)"
              />
            </template>
          </Column>

          <Column field="payment_date" header="Fecha de Pago" style="min-width: 150px">
            <template #body="{ data }">
              {{ data.payment_date ? formatDateTime(data.payment_date) : '-' }}
            </template>
          </Column>

          <Column field="payment_method" header="Método" style="min-width: 120px" />

          <Column field="total" header="Total" style="min-width: 120px" alignFrozen="right" frozen>
            <template #body="{ data }">
              <span class="font-semibold">
                {{ data.currency }} {{ formatCurrency(data.total) }}
              </span>
            </template>
          </Column>

          <Column field="shipping_status" header="Estado de Envío" style="min-width: 150px" alignFrozen="right" frozen>
            <template #body="{ data }">
              <AppBadge
                :label="data.shipping_status"
                variant="secondary"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Initial Empty State -->
    <Card v-else>
      <template #content>
        <AppEmptyState
          icon="pi-filter"
          title="Selecciona los filtros"
          message="Configura los filtros y haz clic en 'Aplicar Filtros' para generar el reporte"
        />
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import ReportFiltersCard from '@/components/reports/ReportFiltersCard.vue'
import ExportButton from '@/components/reports/ExportButton.vue'
import reportsApi from '@/api/reports.api'
import type {
  ReportFilters,
  ReportPreviewResponse,
  PaymentGateway,
  ExportFormat
} from '@/types/report.types'
import { PaymentStatus } from '@/types/report.types'

const toast = useToast()

// State
const filters = ref<ReportFilters>({
  payment_status: PaymentStatus.ALL,
  payment_gateway_id: 0
})

const previewData = ref<ReportPreviewResponse | null>(null)
const paymentGateways = ref<PaymentGateway[]>([])
const loadingPreview = ref(false)
const loadingGateways = ref(false)
const exporting = ref(false)
const error = ref<string | null>(null)
const hasAppliedFilters = ref(false)

// Computed
const hasPreviewData = computed(() => {
  return previewData.value && previewData.value.data.length > 0
})

// Methods
const handleApplyFilters = async () => {
  try {
    loadingPreview.value = true
    error.value = null
    hasAppliedFilters.value = true

    previewData.value = await reportsApi.getOrdersReportPreview(filters.value)

    if (!hasPreviewData.value) {
      toast.add({
        severity: 'info',
        summary: 'Sin resultados',
        detail: 'No se encontraron datos con los filtros aplicados',
        life: 3000
      })
    }
  } catch (err) {
    console.error('Error loading report preview:', err)
    error.value = err instanceof Error ? err.message : 'Error desconocido'
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
    exporting.value = true

    const blob = await reportsApi.exportOrdersReport(filters.value, format)

    // Generate filename
    const dateFrom = filters.value.date_from?.replace(/-/g, '')
    const dateTo = filters.value.date_to?.replace(/-/g, '')
    const filename = `reporte_pedidos_${dateFrom}_${dateTo}.${format}`

    // Download file
    reportsApi.downloadFile(blob, filename)

    toast.add({
      severity: 'success',
      summary: 'Exportado',
      detail: `Reporte exportado exitosamente como ${format.toUpperCase()}`,
      life: 3000
    })
  } catch (err) {
    console.error('Error exporting report:', err)
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

const loadPaymentGateways = async () => {
  try {
    loadingGateways.value = true
    paymentGateways.value = await reportsApi.getPaymentGateways()
  } catch (err) {
    console.error('Error loading payment gateways:', err)
  } finally {
    loadingGateways.value = false
  }
}

// Formatting helpers
const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number): string => {
  return amount.toFixed(2)
}

const getPaymentStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'secondary' => {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('aprobado') || statusLower.includes('approved')) return 'success'
  if (statusLower.includes('pendiente') || statusLower.includes('pending')) return 'warning'
  if (statusLower.includes('rechazado') || statusLower.includes('rejected')) return 'danger'
  if (statusLower.includes('expirado') || statusLower.includes('expired')) return 'secondary'
  return 'secondary'
}

// Lifecycle
onMounted(() => {
  loadPaymentGateways()
})
</script>
