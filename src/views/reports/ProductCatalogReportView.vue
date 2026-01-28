<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Reporte de Catálogo de Productos</h1>
      <p class="text-secondary-600 mt-1">
        Exporta y analiza tu catálogo de productos
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Buscar</label>
            <InputText
              v-model="filters.search"
              placeholder="Nombre o SKU"
              class="w-full"
              @keyup.enter="handleApplyFilters"
            />
          </div>

          <!-- Published -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Publicación</label>
            <Dropdown
              v-model="filters.published"
              :options="publishedOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
            />
          </div>

          <!-- Stock Status -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Stock</label>
            <Dropdown
              v-model="filters.stock_status"
              :options="stockOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Categoría</label>
            <Dropdown
              v-model="filters.category_id"
              :options="categories"
              optionLabel="name"
              optionValue="id"
              placeholder="Todas"
              class="w-full"
              :loading="loadingCategories"
              showClear
            />
          </div>

          <!-- Brand -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Marca</label>
            <Dropdown
              v-model="filters.brand_id"
              :options="brands"
              optionLabel="name"
              optionValue="id"
              placeholder="Todas"
              class="w-full"
              :loading="loadingBrands"
              showClear
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
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-secondary-900">Exportar Catálogo</h3>
            <p class="text-sm text-secondary-600 mt-1">
              {{ previewData?.total_count || 0 }} productos encontrados
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
            icon="pi-inbox"
            title="No se encontraron productos"
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
          <Column field="product_id" header="ID" style="min-width: 80px" frozen>
            <template #body="{ data }">
              <span class="font-mono">{{ data.product_id }}</span>
            </template>
          </Column>

          <Column field="sku" header="SKU" style="min-width: 120px">
            <template #body="{ data }">
              <span class="font-mono">{{ data.sku || '-' }}</span>
            </template>
          </Column>

          <Column field="name" header="Nombre" style="min-width: 250px" />

          <Column field="stock" header="Stock" style="min-width: 100px">
            <template #body="{ data }">
              <span v-if="data.stock_unlimited" class="text-green-600 font-medium">Ilimitado</span>
              <span v-else :class="data.stock_raw === 0 ? 'text-red-600 font-medium' : ''">
                {{ data.stock_raw }}
              </span>
            </template>
          </Column>

          <Column field="price_without_tax" header="Precio sin IGV" style="min-width: 130px">
            <template #body="{ data }">
              S/ {{ formatCurrency(data.price_without_tax) }}
            </template>
          </Column>

          <Column field="price_with_tax" header="Precio con IGV" style="min-width: 130px">
            <template #body="{ data }">
              <span class="font-semibold">S/ {{ formatCurrency(data.price_with_tax) }}</span>
            </template>
          </Column>

          <Column field="published_label" header="Publicado" style="min-width: 100px">
            <template #body="{ data }">
              <AppBadge
                :label="data.published_label"
                :variant="data.published ? 'success' : 'neutral'"
              />
            </template>
          </Column>

          <Column field="category" header="Categoría" style="min-width: 150px">
            <template #body="{ data }">
              {{ data.category || '-' }}
            </template>
          </Column>

          <Column field="brand" header="Marca" style="min-width: 120px">
            <template #body="{ data }">
              {{ data.brand || '-' }}
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
import { categoryApi } from '@/api/category.api'
import { brandApi } from '@/api/brand.api'
import type {
  ProductCatalogFilters,
  ProductCatalogPreviewResponse,
  ExportFormat
} from '@/types/report.types'

const toast = useToast()

// State
const filters = ref<ProductCatalogFilters>({
  search: '',
  published: '',
  stock_status: 'all',
  category_id: undefined,
  brand_id: undefined
})

const previewData = ref<ProductCatalogPreviewResponse | null>(null)
const categories = ref<{ id: number; name: string }[]>([])
const brands = ref<{ id: number; name: string }[]>([])
const loadingPreview = ref(false)
const loadingCategories = ref(false)
const loadingBrands = ref(false)
const exporting = ref(false)
const error = ref<string | null>(null)

const publishedOptions = [
  { label: 'Todos', value: '' },
  { label: 'Publicados', value: '1' },
  { label: 'No Publicados', value: '0' }
]

const stockOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Con Stock', value: 'in_stock' },
  { label: 'Stock Limitado', value: 'limited' },
  { label: 'Sin Stock', value: 'out_of_stock' }
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

    previewData.value = await reportsApi.getProductCatalogPreview(filters.value)

    if (!hasPreviewData.value) {
      toast.add({
        severity: 'info',
        summary: 'Sin resultados',
        detail: 'No se encontraron productos con los filtros aplicados',
        life: 3000
      })
    }
  } catch (err) {
    console.error('Error loading product catalog preview:', err)
    error.value = err instanceof Error ? err.message : 'Error desconocido'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la vista previa del catálogo',
      life: 3000
    })
  } finally {
    loadingPreview.value = false
  }
}

const handleExport = async (format: ExportFormat) => {
  try {
    exporting.value = true

    const blob = await reportsApi.exportProductCatalog(filters.value, format)

    const filename = `catalogo_productos_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${format}`

    reportsApi.downloadFile(blob, filename)

    toast.add({
      severity: 'success',
      summary: 'Exportado',
      detail: `Catálogo exportado exitosamente como ${format.toUpperCase()}`,
      life: 3000
    })
  } catch (err) {
    console.error('Error exporting product catalog:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo exportar el catálogo',
      life: 3000
    })
  } finally {
    exporting.value = false
  }
}

const handleClearFilters = () => {
  filters.value = {
    search: '',
    published: '',
    stock_status: 'all',
    category_id: undefined,
    brand_id: undefined
  }
  handleApplyFilters()
}

const formatCurrency = (amount: number): string => {
  return amount.toFixed(2)
}

const loadCategories = async () => {
  try {
    loadingCategories.value = true
    const response = await categoryApi.getAll()
    categories.value = (response.data ?? []).map((cat: any) => ({
      id: cat.id,
      name: cat.name
    }))
  } catch (err) {
    console.error('Error loading categories:', err)
  } finally {
    loadingCategories.value = false
  }
}

const loadBrands = async () => {
  try {
    loadingBrands.value = true
    const response = await brandApi.getAll()
    brands.value = (response.data ?? []).map((brand: any) => ({
      id: brand.id,
      name: brand.name
    }))
  } catch (err) {
    console.error('Error loading brands:', err)
  } finally {
    loadingBrands.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadCategories()
  loadBrands()
  handleApplyFilters()
})
</script>
