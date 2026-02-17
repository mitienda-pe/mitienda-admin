<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductManagementStore } from '@/stores/product-management.store'
import DataTable, { type DataTableSortEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import SearchBar from '@/components/common/SearchBar.vue'
import CsvImportDialog from '@/components/products/CsvImportDialog.vue'
import { AppBadge } from '@/components/ui'
import type { ProductStockItem } from '@/types/product.types'

const store = useProductManagementStore()
const toast = useToast()
const importDialogVisible = ref(false)

const searchQuery = ref('')
const expandedRows = ref<ProductStockItem[]>([])

const sortFieldMap: Record<string, string> = {
  sku: 'sku',
  name: 'name',
  stock: 'stock',
}

const sortField = ref<string>('name')
const sortOrder = ref<number>(1)

onMounted(() => {
  store.fetchStock()
})

// ── Handlers ──

const onSearch = (value: string) => {
  searchQuery.value = value
  store.stockPagination.page = 1
  store.fetchStock({ search: value })
}

const onPage = (event: { page: number; rows: number }) => {
  store.stockPagination.page = event.page + 1
  store.stockPagination.limit = event.rows
  store.fetchStock({ search: searchQuery.value })
}

const onSort = (event: DataTableSortEvent) => {
  const field = typeof event.sortField === 'string' ? event.sortField : 'name'
  const backendField = sortFieldMap[field] || 'name'
  const order = event.sortOrder === 1 ? 'ASC' : 'DESC'
  sortField.value = field
  sortOrder.value = event.sortOrder ?? 1
  store.stockPagination.page = 1
  store.fetchStock({
    search: searchQuery.value,
    sort_field: backendField,
    sort_order: order,
  })
}

// ── Stock editing ──

const onStockChange = (productId: number, value: number) => {
  if (value == null || value < 0) return
  store.updateLocalStock(productId, 'stock', value)
}

const onUnlimitedChange = (productId: number, value: boolean) => {
  store.updateLocalStock(productId, 'unlimited_stock', value)
}

const onVariantStockChange = (productId: number, variantId: number, value: number) => {
  if (value == null || value < 0) return
  store.updateLocalVariantStock(productId, variantId, 'stock', value)
}

const onVariantUnlimitedChange = (
  productId: number,
  variantId: number,
  value: boolean,
) => {
  store.updateLocalVariantStock(productId, variantId, 'unlimited_stock', value)
}

// ── Save ──

const handleSave = async () => {
  const ok = await store.saveStockChanges()
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Stock actualizado',
      detail: 'Los cambios se guardaron correctamente',
      life: 3000,
    })
    store.fetchStock({ search: searchQuery.value })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.stockError || 'No se pudieron guardar los cambios',
      life: 5000,
    })
  }
}

const handleDiscard = () => {
  store.resetStockDirty()
  store.fetchStock({ search: searchQuery.value })
}

// ── Export ──

const handleExport = async () => {
  try {
    const { productManagementApi } = await import('@/api/product-management.api')
    const blob = await productManagementApi.exportStock()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo exportar', life: 3000 })
  }
}

// ── Row expand toggle ──

const toggleRow = (data: ProductStockItem) => {
  const idx = expandedRows.value.findIndex(r => r.id === data.id)
  if (idx >= 0) {
    expandedRows.value = expandedRows.value.filter(r => r.id !== data.id)
  } else {
    expandedRows.value = [...expandedRows.value, data]
  }
}

// ── Helpers ──

const onImported = () => {
  store.fetchStock({ search: searchQuery.value })
}

const hasDirtyChanges = computed(() => store.dirtyStockCount > 0)
const first = computed(
  () => (store.stockPagination.page - 1) * store.stockPagination.limit,
)
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold text-secondary">Stock</h1>
        <span class="text-sm text-secondary-500">
          {{ store.stockPagination.total }} productos
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
          :loading="store.stockLoading"
        >
          <template #default>
            <i class="pi pi-save mr-2"></i>
            Guardar Cambios
            <span
              class="ml-2 bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5"
            >
              {{ store.dirtyStockCount }}
            </span>
          </template>
        </Button>
      </template>
    </div>

    <!-- Loading -->
    <div
      v-if="store.stockLoading && store.stockItems.length === 0"
      class="flex justify-center py-20"
    >
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.stockError && store.stockItems.length === 0"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
      <p class="text-red-700">{{ store.stockError }}</p>
      <Button
        label="Reintentar"
        icon="pi pi-refresh"
        class="mt-4"
        @click="store.fetchStock()"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="store.stockItems.length === 0 && !store.stockLoading"
      class="bg-white border border-gray-200 rounded-lg p-12 text-center"
    >
      <i class="pi pi-box text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay productos</h3>
      <p class="text-gray-600">
        {{ searchQuery ? 'No se encontraron productos con esa busqueda' : 'No hay productos registrados' }}
      </p>
    </div>

    <!-- DataTable -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="store.stockItems"
        :loading="store.stockLoading"
        :paginator="true"
        :rows="store.stockPagination.limit"
        :totalRecords="store.stockPagination.total"
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
        <!-- Hidden expander (PrimeVue needs this for #expansion to render) -->
        <Column expander class="hidden-expander" />

        <!-- Visible toggle (only for products with variants) -->
        <Column style="width: 40px">
          <template #body="{ data }">
            <Button
              v-if="data.has_variants"
              type="button"
              :icon="expandedRows.some(r => r.id === data.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
              text
              rounded
              size="small"
              @click="toggleRow(data)"
            />
          </template>
        </Column>

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

        <!-- Stock -->
        <Column field="stock" header="Stock" sortable style="min-width: 130px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <InputNumber
                :modelValue="data.stock"
                @update:modelValue="val => onStockChange(data.id, val)"
                :min="0"
                :useGrouping="false"
                :disabled="data.unlimited_stock"
                class="w-24"
                inputClass="w-full text-right text-sm"
                size="small"
              />
              <i
                v-if="!data.unlimited_stock"
                class="pi pi-circle-fill text-xs"
                :class="{
                  'text-red-500': data.stock === 0,
                  'text-yellow-500': data.stock > 0 && data.stock <= 5,
                  'text-green-500': data.stock > 5,
                }"
              ></i>
            </div>
          </template>
        </Column>

        <!-- Ilimitado -->
        <Column header="Ilimitado" style="width: 90px">
          <template #body="{ data }">
            <Checkbox
              :modelValue="data.unlimited_stock"
              @update:modelValue="val => onUnlimitedChange(data.id, val)"
              :binary="true"
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

              <Column header="Stock" style="min-width: 130px">
                <template #body="{ data: variant }">
                  <div class="flex items-center gap-2">
                    <InputNumber
                      :modelValue="variant.stock"
                      @update:modelValue="val => onVariantStockChange(data.id, variant.id, val)"
                      :min="0"
                      :useGrouping="false"
                      :disabled="variant.unlimited_stock"
                      class="w-24"
                      inputClass="w-full text-right text-sm"
                      size="small"
                    />
                    <i
                      v-if="!variant.unlimited_stock"
                      class="pi pi-circle-fill text-xs"
                      :class="{
                        'text-red-500': variant.stock === 0,
                        'text-yellow-500': variant.stock > 0 && variant.stock <= 5,
                        'text-green-500': variant.stock > 5,
                      }"
                    ></i>
                  </div>
                </template>
              </Column>

              <Column header="Ilimitado" style="width: 90px">
                <template #body="{ data: variant }">
                  <Checkbox
                    :modelValue="variant.unlimited_stock"
                    @update:modelValue="val => onVariantUnlimitedChange(data.id, variant.id, val)"
                    :binary="true"
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
      mode="stock"
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

/* Hide the PrimeVue built-in expander column (we use a manual toggle) */
:deep(.hidden-expander) {
  display: none !important;
}
</style>
