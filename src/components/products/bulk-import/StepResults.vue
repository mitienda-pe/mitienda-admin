<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import type { BulkProcessingResult, BulkImportSummary } from '@/types/product.types'

interface Props {
  results: BulkProcessingResult[]
  summary: BulkImportSummary
  mode: 'create' | 'edit'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  downloadErrors: []
  newImport: []
  goToProducts: []
}>()

type FilterType = 'all' | 'success' | 'error'
const filter = ref<FilterType>('all')

const filteredResults = computed(() => {
  if (filter.value === 'success') return props.results.filter(r => r.success)
  if (filter.value === 'error') return props.results.filter(r => !r.success)
  return props.results
})

const hasErrors = computed(() => props.summary.errors > 0)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-secondary-700">Reporte de importacion</h3>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-gray-50 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-secondary-700">{{ summary.total }}</div>
        <div class="text-sm text-gray-500">Total</div>
      </div>
      <div class="bg-green-50 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-green-600">
          {{ mode === 'create' ? summary.created : summary.updated }}
        </div>
        <div class="text-sm text-gray-500">
          {{ mode === 'create' ? 'Creados' : 'Actualizados' }}
        </div>
      </div>
      <div class="bg-red-50 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-red-600">{{ summary.errors }}</div>
        <div class="text-sm text-gray-500">Errores</div>
      </div>
      <div v-if="summary.skipped > 0" class="bg-yellow-50 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-yellow-600">{{ summary.skipped }}</div>
        <div class="text-sm text-gray-500">Omitidos</div>
      </div>
    </div>

    <!-- Filter buttons -->
    <div class="flex gap-2">
      <Button
        label="Todos"
        :severity="filter === 'all' ? undefined : 'secondary'"
        :outlined="filter !== 'all'"
        size="small"
        @click="filter = 'all'"
      />
      <Button
        label="Exitosos"
        :severity="filter === 'success' ? 'success' : 'secondary'"
        :outlined="filter !== 'success'"
        size="small"
        @click="filter = 'success'"
      />
      <Button
        label="Con errores"
        :severity="filter === 'error' ? 'danger' : 'secondary'"
        :outlined="filter !== 'error'"
        size="small"
        @click="filter = 'error'"
      />
    </div>

    <!-- Results table -->
    <DataTable :value="filteredResults" scrollable scrollHeight="400px" class="text-sm">
      <Column header="Fila" field="rowNumber" style="width: 70px" />
      <Column header="SKU" field="sku" style="width: 120px" />
      <Column header="Producto" field="productName" style="min-width: 200px" />
      <Column header="Estado" style="width: 120px">
        <template #body="{ data }">
          <Tag
            v-if="data.success"
            :value="data.action === 'created' ? 'Creado' : 'Actualizado'"
            severity="success"
          />
          <Tag v-else-if="data.action === 'skipped'" value="Omitido" severity="warning" />
          <Tag v-else value="Error" severity="danger" />
        </template>
      </Column>
      <Column header="Detalle" style="min-width: 250px">
        <template #body="{ data }">
          <span v-if="data.success && data.productId" class="text-gray-500">
            ID: {{ data.productId }}
          </span>
          <span v-else-if="data.error" class="text-red-600">
            {{ data.error }}
          </span>
        </template>
      </Column>
    </DataTable>

    <!-- Action buttons -->
    <div class="flex gap-3 justify-center pt-4">
      <Button
        v-if="hasErrors"
        label="Descargar Reporte de Errores"
        icon="pi pi-download"
        severity="danger"
        outlined
        @click="emit('downloadErrors')"
      />
      <Button
        label="Nueva Importacion"
        icon="pi pi-refresh"
        outlined
        @click="emit('newImport')"
      />
      <Button
        label="Volver a Productos"
        icon="pi pi-arrow-left"
        @click="emit('goToProducts')"
      />
    </div>
  </div>
</template>
