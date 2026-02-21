<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUpload from 'primevue/fileupload'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { BulkCsvParsedRow } from '@/types/product.types'

interface Props {
  mode: 'create' | 'edit'
  parsedRows: BulkCsvParsedRow[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})
const emit = defineEmits<{
  fileSelected: [file: File]
}>()

const parseError = ref<string | null>(null)

const validCount = computed(() => props.parsedRows.filter(r => r.isValid).length)
const errorCount = computed(() => props.parsedRows.filter(r => !r.isValid).length)
const warningCount = computed(() =>
  props.parsedRows.filter(r => r.isValid && r.warnings.length > 0).length,
)

const previewRows = computed(() => props.parsedRows.slice(0, 50))

const visibleColumns = computed(() => {
  if (props.parsedRows.length === 0) return []
  const raw = props.parsedRows[0].raw
  return Object.keys(raw)
})

function onFileSelect(event: { files: File[] }) {
  if (event.files.length > 0) {
    parseError.value = null
    emit('fileSelected', event.files[0])
  }
}

function getRowClass(row: BulkCsvParsedRow): string {
  if (!row.isValid) return 'bg-red-50'
  if (row.warnings.length > 0) return 'bg-yellow-50'
  return ''
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-secondary-700">Subir archivo CSV</h3>
      <p class="text-sm text-gray-500 mt-1">
        Selecciona el archivo CSV que completaste con los datos de tus productos.
      </p>
    </div>

    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <FileUpload
        mode="basic"
        accept=".csv"
        :auto="false"
        chooseLabel="Seleccionar archivo CSV"
        chooseIcon="pi pi-upload"
        :maxFileSize="10000000"
        @select="onFileSelect"
      />
    </div>

    <div v-if="parseError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />
      {{ parseError }}
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <template v-if="parsedRows.length > 0 && !isLoading">
      <!-- Summary -->
      <div class="flex gap-4">
        <div class="bg-gray-50 rounded-lg p-4 flex-1 text-center">
          <div class="text-2xl font-bold text-secondary-700">{{ parsedRows.length }}</div>
          <div class="text-sm text-gray-500">Total filas</div>
        </div>
        <div class="bg-green-50 rounded-lg p-4 flex-1 text-center">
          <div class="text-2xl font-bold text-green-600">{{ validCount }}</div>
          <div class="text-sm text-gray-500">Validas</div>
        </div>
        <div v-if="warningCount > 0" class="bg-yellow-50 rounded-lg p-4 flex-1 text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ warningCount }}</div>
          <div class="text-sm text-gray-500">Con advertencias</div>
        </div>
        <div v-if="errorCount > 0" class="bg-red-50 rounded-lg p-4 flex-1 text-center">
          <div class="text-2xl font-bold text-red-600">{{ errorCount }}</div>
          <div class="text-sm text-gray-500">Con errores</div>
        </div>
      </div>

      <!-- Preview table -->
      <DataTable
        :value="previewRows"
        :rowClass="getRowClass"
        scrollable
        scrollHeight="400px"
        class="text-sm"
      >
        <Column header="Fila" style="width: 60px">
          <template #body="{ data }">
            {{ data.rowNumber }}
          </template>
        </Column>
        <Column header="Estado" style="width: 100px">
          <template #body="{ data }">
            <Tag
              v-if="!data.isValid"
              severity="danger"
              value="Error"
            />
            <Tag
              v-else-if="data.warnings.length > 0"
              severity="warning"
              value="Advertencia"
            />
            <Tag v-else severity="success" value="OK" />
          </template>
        </Column>
        <Column
          v-for="col in visibleColumns"
          :key="col"
          :header="col"
          style="min-width: 120px"
        >
          <template #body="{ data }">
            {{ data.raw[col] || '' }}
          </template>
        </Column>
        <Column header="Detalle" style="min-width: 200px">
          <template #body="{ data }">
            <div v-if="data.errors.length > 0" class="text-red-600 text-xs">
              <div v-for="(err, i) in data.errors" :key="i">{{ err }}</div>
            </div>
            <div v-if="data.warnings.length > 0" class="text-yellow-600 text-xs">
              <div v-for="(w, i) in data.warnings" :key="i">{{ w }}</div>
            </div>
          </template>
        </Column>
      </DataTable>

      <p v-if="parsedRows.length > 50" class="text-sm text-gray-500 text-center">
        Mostrando las primeras 50 filas de {{ parsedRows.length }}
      </p>
    </template>
  </div>
</template>
