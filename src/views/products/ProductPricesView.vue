<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProductManagementStore } from '@/stores/product-management.store'
import DataTable, { type DataTableSortEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import SearchBar from '@/components/common/SearchBar.vue'
import CsvImportDialog from '@/components/products/CsvImportDialog.vue'
import { AppBadge } from '@/components/ui'
import type { ProductPriceItem } from '@/types/product.types'

const store = useProductManagementStore()
const toast = useToast()

const searchQuery = ref('')
const expandedRows = ref<ProductPriceItem[]>([])
const importDialogVisible = ref(false)

// ── Sort mapping ──

const sortFieldMap: Record<string, string> = {
  sku: 'sku',
  name: 'name',
  price_without_tax: 'price_without_tax',
  price: 'price',
}

const sortField = ref<string>('name')
const sortOrder = ref<number>(1)

// ── Lifecycle ──

onMounted(() => {
  store.fetchPrices()
})

// ── Handlers ──

const onSearch = (value: string) => {
  searchQuery.value = value
  store.pricePagination.page = 1
  store.fetchPrices({ search: value })
}

const onPage = (event: { page: number; rows: number }) => {
  store.pricePagination.page = event.page + 1
  store.pricePagination.limit = event.rows
  store.fetchPrices({ search: searchQuery.value })
}

const onSort = (event: DataTableSortEvent) => {
  const field = typeof event.sortField === 'string' ? event.sortField : 'name'
  const backendField = sortFieldMap[field] || 'name'
  const order = event.sortOrder === 1 ? 'ASC' : 'DESC'
  sortField.value = field
  sortOrder.value = event.sortOrder ?? 1
  store.pricePagination.page = 1
  store.fetchPrices({
    search: searchQuery.value,
    sort_field: backendField,
    sort_order: order,
  })
}

// ── Price editing ──

const onPriceChange = (productId: number, field: 'price' | 'price_without_tax', value: number) => {
  if (value == null || value < 0) return
  store.updateLocalPrice(productId, field, value)
}

const onVariantPriceChange = (
  productId: number,
  variantId: number,
  field: 'price' | 'price_without_tax',
  value: number,
) => {
  if (value == null || value < 0) return
  store.updateLocalVariantPrice(productId, variantId, field, value)
}

// ── Save ──

const handleSave = async () => {
  const ok = await store.savePriceChanges()
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Precios actualizados',
      detail: 'Los cambios se guardaron correctamente',
      life: 3000,
    })
    store.fetchPrices({ search: searchQuery.value })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.priceError || 'No se pudieron guardar los cambios',
      life: 5000,
    })
  }
}

const handleDiscard = () => {
  store.resetPriceDirty()
  store.fetchPrices({ search: searchQuery.value })
}

// ── Export ──

const handleExport = async () => {
  try {
    const { productManagementApi } = await import('@/api/product-management.api')
    const blob = await productManagementApi.exportPrices()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `precios_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo exportar', life: 3000 })
  }
}

// ── Calculate missing prices ──

const calculating = ref(false)

const handleCalculateMissing = async () => {
  calculating.value = true
  try {
    const { productManagementApi } = await import('@/api/product-management.api')
    const response = await productManagementApi.calculateMissingPrices()
    if (response.success && response.data) {
      const { updated, without_tax_calculated, with_tax_calculated } = response.data
      if (updated === 0) {
        toast.add({
          severity: 'info',
          summary: 'Sin cambios',
          detail: 'Todos los productos ya tienen ambos precios calculados',
          life: 3000,
        })
      } else {
        const parts = []
        if (without_tax_calculated > 0) parts.push(`${without_tax_calculated} sin IGV`)
        if (with_tax_calculated > 0) parts.push(`${with_tax_calculated} con IGV`)
        toast.add({
          severity: 'success',
          summary: `${updated} precios calculados`,
          detail: `Se calcularon: ${parts.join(', ')}`,
          life: 5000,
        })
        store.fetchPrices({ search: searchQuery.value })
      }
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron calcular los precios', life: 3000 })
  } finally {
    calculating.value = false
  }
}

// ── Auto-expand rows with variants ──

watch(
  () => store.priceItems,
  items => {
    expandedRows.value = items.filter(item => item.has_variants)
  },
  { immediate: true },
)

// ── Helpers ──

const taxLabel = (affectation: number) => {
  switch (affectation) {
    case 2:
      return 'Exonerado'
    case 3:
      return 'Inafecto'
    default:
      return 'Gravado'
  }
}

const taxSeverity = (affectation: number): 'info' | 'success' | 'warning' => {
  switch (affectation) {
    case 2:
      return 'warning'
    case 3:
      return 'info'
    default:
      return 'success'
  }
}

const onImported = () => {
  store.fetchPrices({ search: searchQuery.value })
}

const hasDirtyChanges = computed(() => store.dirtyPriceCount > 0)
const first = computed(
  () => (store.pricePagination.page - 1) * store.pricePagination.limit,
)
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold text-secondary">Precios</h1>
        <span class="text-sm text-secondary-500">
          {{ store.pricePagination.total }} productos
        </span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex-1 max-w-md">
        <SearchBar
          v-model="searchQuery"
          placeholder="Buscar por nombre o SKU..."
          @search="onSearch"
        />
      </div>
      <Button
        label="Calcular faltantes"
        icon="pi pi-calculator"
        outlined
        size="small"
        :loading="calculating"
        @click="handleCalculateMissing"
      />
      <Button
        label="Exportar CSV"
        icon="pi pi-download"
        outlined
        size="small"
        @click="handleExport"
      />
      <Button
        label="Importar CSV"
        icon="pi pi-upload"
        outlined
        size="small"
        @click="importDialogVisible = true"
      />
      <template v-if="hasDirtyChanges">
        <Button
          label="Descartar"
          icon="pi pi-undo"
          severity="secondary"
          outlined
          size="small"
          @click="handleDiscard"
        />
        <Button
          icon="pi pi-save"
          size="small"
          @click="handleSave"
          :loading="store.priceLoading"
        >
          <template #default>
            <i class="pi pi-save mr-2"></i>
            Guardar Cambios
            <span
              class="ml-2 bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5"
            >
              {{ store.dirtyPriceCount }}
            </span>
          </template>
        </Button>
      </template>
    </div>

    <!-- Loading -->
    <div
      v-if="store.priceLoading && store.priceItems.length === 0"
      class="flex justify-center py-20"
    >
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.priceError && store.priceItems.length === 0"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
      <p class="text-red-700">{{ store.priceError }}</p>
      <Button
        label="Reintentar"
        icon="pi pi-refresh"
        class="mt-4"
        @click="store.fetchPrices()"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="store.priceItems.length === 0 && !store.priceLoading"
      class="bg-white border border-gray-200 rounded-lg p-12 text-center"
    >
      <i class="pi pi-dollar text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay productos</h3>
      <p class="text-gray-600">
        {{ searchQuery ? 'No se encontraron productos con esa busqueda' : 'No hay productos registrados' }}
      </p>
    </div>

    <!-- DataTable -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="store.priceItems"
        :loading="store.priceLoading"
        :paginator="true"
        :rows="store.pricePagination.limit"
        :totalRecords="store.pricePagination.total"
        :lazy="true"
        :first="first"
        :rowsPerPageOptions="[25, 50, 100]"
        :sortField="sortField"
        :sortOrder="sortOrder"
        v-model:expandedRows="expandedRows"
        @page="onPage"
        @sort="onSort"
        :rowHover="true"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        dataKey="id"
        size="small"
      >
        <!-- Expander column (hidden toggle, auto-expanded via watch) -->
        <Column expander style="width: 0; padding: 0" />

        <!-- Imagen -->
        <Column header="" style="width: 50px">
          <template #body="{ data }">
            <div class="w-10 aspect-square">
              <img
                v-if="data.image"
                :src="data.image"
                :alt="data.name"
                class="w-full h-full object-cover rounded"
              />
              <div
                v-else
                class="w-full h-full bg-gray-100 rounded flex items-center justify-center"
              >
                <i class="pi pi-image text-gray-400"></i>
              </div>
            </div>
          </template>
        </Column>

        <!-- SKU -->
        <Column field="sku" header="SKU" sortable style="min-width: 100px">
          <template #body="{ data }">
            <span class="text-sm font-mono text-gray-600">{{ data.sku || '-' }}</span>
          </template>
        </Column>

        <!-- Producto -->
        <Column field="name" header="Producto" sortable style="min-width: 200px">
          <template #body="{ data }">
            <span class="font-medium text-gray-900">{{ data.name }}</span>
          </template>
        </Column>

        <!-- Precio sin IGV -->
        <Column
          field="price_without_tax"
          header="Precio sin IGV"
          sortable
          style="min-width: 160px"
        >
          <template #body="{ data }">
            <InputNumber
              :modelValue="data.price_without_tax"
              @update:modelValue="val => onPriceChange(data.id, 'price_without_tax', val)"
              mode="decimal"
              :minFractionDigits="2"
              :maxFractionDigits="4"
              :min="0"
              :step="0.01"
              class="w-full"
              inputClass="w-full text-right text-sm"
              size="small"
            />
          </template>
        </Column>

        <!-- Precio con IGV -->
        <Column field="price" header="Precio con IGV" sortable style="min-width: 160px">
          <template #body="{ data }">
            <InputNumber
              :modelValue="data.price"
              @update:modelValue="val => onPriceChange(data.id, 'price', val)"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              :min="0"
              :step="0.1"
              class="w-full"
              inputClass="w-full text-right text-sm"
              size="small"
            />
          </template>
        </Column>

        <!-- Afectacion -->
        <Column header="Afectacion" style="width: 110px">
          <template #body="{ data }">
            <Tag
              :value="taxLabel(data.tax_affectation)"
              :severity="taxSeverity(data.tax_affectation)"
              class="text-xs"
            />
          </template>
        </Column>

        <!-- Estado -->
        <Column header="Estado" style="width: 90px">
          <template #body="{ data }">
            <AppBadge
              :variant="data.published ? 'success' : 'neutral'"
              :label="data.published ? 'Activo' : 'Inactivo'"
            />
          </template>
        </Column>

        <!-- Row Expansion: Variantes -->
        <template #expansion="{ data }">
          <div class="p-4 bg-gray-50">
            <h4 class="text-sm font-semibold text-gray-700 mb-3">
              Variantes de {{ data.name }}
            </h4>
            <DataTable
              :value="data.variants"
              dataKey="id"
              size="small"
              class="p-datatable-sm"
            >
              <Column header="SKU" style="min-width: 100px">
                <template #body="{ data: variant }">
                  <span class="text-sm font-mono text-gray-600">{{ variant.sku || '-' }}</span>
                </template>
              </Column>

              <Column header="Variante" style="min-width: 180px">
                <template #body="{ data: variant }">
                  <span class="text-sm text-gray-900">{{ variant.name }}</span>
                </template>
              </Column>

              <Column header="Precio sin IGV" style="min-width: 160px">
                <template #body="{ data: variant }">
                  <InputNumber
                    :modelValue="variant.price_without_tax"
                    @update:modelValue="val => onVariantPriceChange(data.id, variant.id, 'price_without_tax', val)"
                    mode="decimal"
                    :minFractionDigits="2"
                    :maxFractionDigits="4"
                    :min="0"
                    :step="0.01"
                    class="w-full"
                    inputClass="w-full text-right text-sm"
                    size="small"
                  />
                </template>
              </Column>

              <Column header="Precio con IGV" style="min-width: 160px">
                <template #body="{ data: variant }">
                  <InputNumber
                    :modelValue="variant.price"
                    @update:modelValue="val => onVariantPriceChange(data.id, variant.id, 'price', val)"
                    mode="currency"
                    currency="PEN"
                    locale="es-PE"
                    :minFractionDigits="2"
                    :maxFractionDigits="2"
                    :min="0"
                    :step="0.1"
                    class="w-full"
                    inputClass="w-full text-right text-sm"
                    size="small"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Import Dialog -->
    <CsvImportDialog
      :visible="importDialogVisible"
      mode="prices"
      @update:visible="importDialogVisible = $event"
      @imported="onImported"
    />
  </div>
</template>

<style scoped>
:deep(.p-datatable .p-inputnumber) {
  width: 100%;
}

:deep(.p-datatable .p-inputnumber-input) {
  padding: 0.375rem 0.5rem;
}

:deep(.p-datatable-tbody > tr.p-row-expansion > td) {
  padding: 0;
}

/* Hide the expander toggle button and column */
:deep(.p-row-toggler) {
  display: none !important;
}

:deep(th.p-row-toggler-column),
:deep(td.p-row-toggler-column) {
  width: 0 !important;
  padding: 0 !important;
  border: none !important;
}
</style>
