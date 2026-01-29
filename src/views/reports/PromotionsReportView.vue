<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Reporte de Promociones</h1>
      <p class="text-secondary-600 mt-1">
        Exporta y analiza tus promociones activas e históricas
      </p>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-filter text-primary"></i>
          <span>Filtros</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Buscar</label>
            <InputText
              v-model="filters.search"
              placeholder="Nombre o código"
              class="w-full"
              @keyup.enter="handleApplyFilters"
            />
          </div>

          <!-- Estado -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Estado</label>
            <Dropdown
              v-model="filters.estado"
              :options="estadoOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas"
              class="w-full"
            />
          </div>

          <!-- Tipo Descuento -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo Descuento</label>
            <Dropdown
              v-model="filters.tipo_descuento"
              :options="tipoDescuentoOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
            />
          </div>

          <!-- Origen -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Origen</label>
            <Dropdown
              v-model="filters.origen"
              :options="origenOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex items-center gap-3 mt-4">
          <AppButton
            label="Aplicar Filtros"
            icon="pi pi-search"
            @click="handleApplyFilters"
          />
          <AppButton
            label="Limpiar"
            icon="pi pi-times"
            variant="secondary"
            @click="handleClearFilters"
          />
        </div>
      </template>
    </Card>

    <!-- Export Section -->
    <Card class="mb-6">
      <template #content>
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 class="text-lg font-semibold text-secondary-900">Exportar Promociones</h3>
            <p class="text-sm text-secondary-600 mt-1">
              {{ previewData?.total_count || 0 }} promociones encontradas
              <span v-if="previewData?.has_more" class="text-orange-600">
                (mostrando primeras 100 en la vista previa)
              </span>
            </p>
          </div>

          <div class="flex items-center gap-4">
            <!-- Export Level Selector -->
            <div class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
              <label class="text-sm font-medium text-secondary-700">Nivel:</label>
              <div class="flex gap-2">
                <label class="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    value="summary"
                    v-model="exportLevel"
                    class="text-primary focus:ring-primary"
                  />
                  <span class="text-sm text-secondary-700">Resumen</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    value="detailed"
                    v-model="exportLevel"
                    class="text-primary focus:ring-primary"
                  />
                  <span class="text-sm text-secondary-700">Detallado</span>
                </label>
              </div>
            </div>

            <ExportButton
              :loading="exporting"
              :has-data="hasPreviewData"
              @export="handleExport"
            />
          </div>
        </div>
        <p class="text-xs text-secondary-500 mt-2">
          <i class="pi pi-info-circle mr-1"></i>
          <strong>Resumen:</strong> una fila por promoción.
          <strong>Detallado:</strong> una fila por producto con precios base y finales calculados.
        </p>
      </template>
    </Card>

    <!-- Preview Table -->
    <Card>
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
            icon="pi-percentage"
            title="No se encontraron promociones"
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
          <Column field="promotion_id" header="ID" style="min-width: 80px" frozen>
            <template #body="{ data }">
              <span class="font-mono">{{ data.promotion_id }}</span>
            </template>
          </Column>

          <Column field="name" header="Nombre" style="min-width: 200px" />

          <Column field="code" header="Código" style="min-width: 120px">
            <template #body="{ data }">
              <span class="font-mono">{{ data.code || '-' }}</span>
            </template>
          </Column>

          <Column field="discount_type" header="Tipo Descuento" style="min-width: 130px" />

          <Column field="discount_value" header="Valor" style="min-width: 100px">
            <template #body="{ data }">
              <span class="font-semibold">
                {{ data.discount_type_raw === 1 ? data.discount_value + '%' : 'S/ ' + data.discount_value.toFixed(2) }}
              </span>
            </template>
          </Column>

          <Column field="start_date" header="Fecha Inicio" style="min-width: 130px">
            <template #body="{ data }">
              {{ formatDate(data.start_date) }}
            </template>
          </Column>

          <Column field="end_date" header="Fecha Fin" style="min-width: 130px">
            <template #body="{ data }">
              {{ data.end_date ? formatDate(data.end_date) : '-' }}
            </template>
          </Column>

          <Column field="status" header="Estado" style="min-width: 110px">
            <template #body="{ data }">
              <AppBadge
                :label="data.status"
                :variant="statusVariant(data.status_raw)"
              />
            </template>
          </Column>

          <Column field="product_count" header="# Productos" style="min-width: 110px">
            <template #body="{ data }">
              <span class="font-semibold">{{ data.product_count }}</span>
            </template>
          </Column>

          <Column field="origin" header="Origen" style="min-width: 100px">
            <template #body="{ data }">
              <AppBadge
                :label="data.origin"
                :variant="data.origin === 'NetSuite' ? 'info' : 'neutral'"
              />
            </template>
          </Column>
        </DataTable>
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
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import { AppButton, AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import ExportButton from '@/components/reports/ExportButton.vue'
import reportsApi from '@/api/reports.api'
import type {
  PromotionsFilters,
  PromotionsPreviewResponse
} from '@/types/report.types'
import { ExportFormat } from '@/types/report.types'

const toast = useToast()

// State
const filters = ref<PromotionsFilters>({
  search: '',
  estado: 'all',
  tipo_descuento: 'all',
  origen: 'all'
})

const exportLevel = ref<'summary' | 'detailed'>('summary')
const previewData = ref<PromotionsPreviewResponse | null>(null)
const loadingPreview = ref(false)
const exporting = ref(false)
const error = ref<string | null>(null)

// Filter options
const estadoOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Activas', value: 'active' },
  { label: 'Inactivas', value: 'inactive' },
  { label: 'Expiradas', value: 'expired' }
]

const tipoDescuentoOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Porcentaje', value: '1' },
  { label: 'Monto fijo', value: '2' }
]

const origenOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'NetSuite', value: 'netsuite' },
  { label: 'Manual', value: 'manual' }
]

// Computed
const hasPreviewData = computed(() => {
  return !!(previewData.value && previewData.value.data.length > 0)
})

// Methods
const handleApplyFilters = async () => {
  try {
    loadingPreview.value = true
    error.value = null

    previewData.value = await reportsApi.getPromotionsPreview(filters.value)

    if (!hasPreviewData.value) {
      toast.add({
        severity: 'info',
        summary: 'Sin resultados',
        detail: 'No se encontraron promociones con los filtros aplicados',
        life: 3000
      })
    }
  } catch (err) {
    console.error('Error loading promotions preview:', err)
    error.value = err instanceof Error ? err.message : 'Error desconocido'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la vista previa de promociones',
      life: 3000
    })
  } finally {
    loadingPreview.value = false
  }
}

const handleExport = async (format: ExportFormat) => {
  try {
    exporting.value = true

    const blob = await reportsApi.exportPromotions(filters.value, format, exportLevel.value)

    const levelSuffix = exportLevel.value === 'detailed' ? '_detallado' : ''
    const filename = `reporte_promociones${levelSuffix}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${format}`

    reportsApi.downloadFile(blob, filename)

    toast.add({
      severity: 'success',
      summary: 'Exportado',
      detail: `Reporte de promociones exportado exitosamente como ${format.toUpperCase()}`,
      life: 3000
    })
  } catch (err) {
    console.error('Error exporting promotions report:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo exportar el reporte de promociones',
      life: 3000
    })
  } finally {
    exporting.value = false
  }
}

const handleClearFilters = () => {
  filters.value = {
    search: '',
    estado: 'all',
    tipo_descuento: 'all',
    origen: 'all'
  }
  handleApplyFilters()
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const statusVariant = (statusRaw: string): 'success' | 'info' | 'warning' | 'danger' | 'neutral' => {
  switch (statusRaw) {
    case 'active': return 'success'
    case 'expired': return 'warning'
    case 'inactive': return 'neutral'
    default: return 'neutral'
  }
}

// Lifecycle
onMounted(() => {
  handleApplyFilters()
})
</script>
