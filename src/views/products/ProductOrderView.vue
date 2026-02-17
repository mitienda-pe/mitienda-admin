<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductManagementStore } from '@/stores/product-management.store'
import DataTable, {
  type DataTableSortEvent,
  type DataTableRowReorderEvent,
} from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import SearchBar from '@/components/common/SearchBar.vue'
import { AppBadge } from '@/components/ui'
import type { ProductOrderItem } from '@/types/product.types'

const store = useProductManagementStore()
const toast = useToast()

const searchQuery = ref('')

const sortFieldMap: Record<string, string> = {
  sku: 'sku',
  name: 'name',
  order: 'order',
}

const sortField = ref<string>('order')
const sortOrder = ref<number>(1)

onMounted(() => {
  store.fetchOrder({ sort_field: 'order', sort_order: 'ASC' })
})

// ── Handlers ──

const onSearch = (value: string) => {
  searchQuery.value = value
  store.orderPagination.page = 1
  store.fetchOrder({ search: value, sort_field: 'order', sort_order: 'ASC' })
}

const onPage = (event: { page: number; rows: number }) => {
  store.orderPagination.page = event.page + 1
  store.orderPagination.limit = event.rows
  store.fetchOrder({
    search: searchQuery.value,
    sort_field: sortFieldMap[sortField.value] || 'order',
    sort_order: sortOrder.value === 1 ? 'ASC' : 'DESC',
  })
}

const onSort = (event: DataTableSortEvent) => {
  const field = typeof event.sortField === 'string' ? event.sortField : 'order'
  const backendField = sortFieldMap[field] || 'order'
  const order = event.sortOrder === 1 ? 'ASC' : 'DESC'
  sortField.value = field
  sortOrder.value = event.sortOrder ?? 1
  store.orderPagination.page = 1
  store.fetchOrder({
    search: searchQuery.value,
    sort_field: backendField,
    sort_order: order,
  })
}

// ── Row reorder (drag & drop) ──

const onRowReorder = (event: DataTableRowReorderEvent) => {
  const reordered = event.value as ProductOrderItem[]
  store.reorderItems([...reordered])
}

// ── Inline order edit ──

const onOrderChange = (productId: number, value: number) => {
  if (value == null || value < 0) return
  store.updateLocalOrder(productId, value)
}

// ── Save ──

const handleSave = async () => {
  const ok = await store.saveOrderChanges()
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Orden actualizado',
      detail: 'Los cambios se guardaron correctamente',
      life: 3000,
    })
    store.fetchOrder({
      search: searchQuery.value,
      sort_field: 'order',
      sort_order: 'ASC',
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.orderError || 'No se pudieron guardar los cambios',
      life: 5000,
    })
  }
}

const handleDiscard = () => {
  store.resetOrderDirty()
  store.fetchOrder({
    search: searchQuery.value,
    sort_field: 'order',
    sort_order: 'ASC',
  })
}

// ── Export ──

const handleExport = async () => {
  try {
    const { productManagementApi } = await import('@/api/product-management.api')
    const blob = await productManagementApi.exportOrder()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orden_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo exportar', life: 3000 })
  }
}

const hasDirtyChanges = computed(() => store.dirtyOrderCount > 0)
const first = computed(
  () => (store.orderPagination.page - 1) * store.orderPagination.limit,
)
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold text-secondary">Orden del Catalogo</h1>
        <span class="text-sm text-secondary-500">
          {{ store.orderPagination.total }} productos
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
          :loading="store.orderLoading"
        >
          <template #default>
            <i class="pi pi-save mr-2"></i>
            Guardar Cambios
            <span
              class="ml-2 bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5"
            >
              {{ store.dirtyOrderCount }}
            </span>
          </template>
        </Button>
      </template>
    </div>

    <!-- Loading -->
    <div
      v-if="store.orderLoading && store.orderItems.length === 0"
      class="flex justify-center py-20"
    >
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.orderError && store.orderItems.length === 0"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
      <p class="text-red-700">{{ store.orderError }}</p>
      <Button
        label="Reintentar"
        icon="pi pi-refresh"
        class="mt-4"
        @click="store.fetchOrder()"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="store.orderItems.length === 0 && !store.orderLoading"
      class="bg-white border border-gray-200 rounded-lg p-12 text-center"
    >
      <i class="pi pi-sort-alt text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay productos</h3>
      <p class="text-gray-600">
        {{ searchQuery ? 'No se encontraron productos con esa busqueda' : 'No hay productos registrados' }}
      </p>
    </div>

    <!-- DataTable -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="store.orderItems"
        :loading="store.orderLoading"
        :paginator="true"
        :rows="store.orderPagination.limit"
        :totalRecords="store.orderPagination.total"
        :lazy="true"
        :first="first"
        :rowsPerPageOptions="[25, 50, 100]"
        :sortField="sortField"
        :sortOrder="sortOrder"
        @page="onPage"
        @sort="onSort"
        @rowReorder="onRowReorder"
        :rowHover="true"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        dataKey="id"
        size="small"
      >
        <!-- Drag handle -->
        <Column :rowReorder="true" style="width: 40px" />

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

        <!-- Orden -->
        <Column field="order" header="Orden" sortable style="min-width: 100px">
          <template #body="{ data }">
            <InputNumber
              :modelValue="data.order"
              @update:modelValue="val => onOrderChange(data.id, val)"
              :min="0"
              :useGrouping="false"
              class="w-20"
              inputClass="w-full text-center text-sm"
              size="small"
            />
          </template>
        </Column>

        <!-- Categorias -->
        <Column header="Categorias" style="min-width: 180px">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="cat in data.categories"
                :key="cat"
                :value="cat"
                severity="info"
                class="text-xs"
              />
              <span
                v-if="!data.categories || data.categories.length === 0"
                class="text-sm text-gray-400"
              >
                Sin categoria
              </span>
            </div>
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
      </DataTable>
    </div>

    <!-- Help text -->
    <div class="text-sm text-gray-500 flex items-center gap-2">
      <i class="pi pi-info-circle"></i>
      Arrastra las filas para reordenar o edita el numero de orden directamente.
    </div>
  </div>
</template>

<style scoped>
:deep(.p-datatable .p-inputnumber) {
  width: 100%;
}

:deep(.p-datatable .p-inputnumber-input) {
  padding: 0.375rem 0.5rem;
}

:deep(.p-datatable .p-datatable-reorderablerow-handle) {
  cursor: grab;
}

:deep(.p-datatable .p-datatable-reorderablerow-handle:active) {
  cursor: grabbing;
}
</style>
