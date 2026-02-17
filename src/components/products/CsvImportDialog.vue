<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { productManagementApi } from '@/api/product-management.api'
import type { CsvImportPreview } from '@/types/product.types'

interface Props {
  visible: boolean
  mode: 'prices' | 'stock'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  imported: []
}>()

const toast = useToast()

// Wizard state
const step = ref<1 | 2 | 3>(1)
const uploading = ref(false)
const confirming = ref(false)
const selectedFile = ref<File | null>(null)
const previewData = ref<CsvImportPreview | null>(null)
const importResult = ref<{ processed: number; updated: number } | null>(null)

const title = computed(() =>
  props.mode === 'prices' ? 'Importar Precios' : 'Importar Stock',
)

const changesCount = computed(() => {
  if (!previewData.value) return 0
  return previewData.value.preview.filter(r => r.has_change).length
})

// ── File selection ──

const onFileSelect = (event: { files: File[] }) => {
  if (event.files.length > 0) {
    selectedFile.value = event.files[0]
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  try {
    const previewFn =
      props.mode === 'prices'
        ? productManagementApi.importPricesPreview
        : productManagementApi.importStockPreview
    const response = await previewFn(selectedFile.value)

    if (response.success && response.data) {
      previewData.value = response.data
      step.value = 2
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo procesar el archivo',
        life: 5000,
      })
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Error al procesar el CSV',
      life: 5000,
    })
  } finally {
    uploading.value = false
  }
}

// ── Confirm ──

const handleConfirm = async () => {
  if (!selectedFile.value) return

  confirming.value = true
  try {
    const confirmFn =
      props.mode === 'prices'
        ? productManagementApi.importPricesConfirm
        : productManagementApi.importStockConfirm
    const response = await confirmFn(selectedFile.value)

    if (response.success && response.data) {
      importResult.value = response.data
      step.value = 3
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron aplicar los cambios',
        life: 5000,
      })
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Error al importar',
      life: 5000,
    })
  } finally {
    confirming.value = false
  }
}

// ── Close / Reset ──

const handleClose = () => {
  if (step.value === 3) {
    emit('imported')
  }
  step.value = 1
  selectedFile.value = null
  previewData.value = null
  importResult.value = null
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    :draggable="false"
    :header="title"
    class="w-full md:w-[700px]"
    @update:visible="handleClose"
  >
    <!-- Step 1: Upload -->
    <div v-if="step === 1" class="space-y-4">
      <p class="text-sm text-gray-600">
        Sube un archivo CSV con las columnas requeridas. Puedes descargar una plantilla
        usando el boton "Exportar CSV" en la vista de {{ mode === 'prices' ? 'precios' : 'stock' }}.
      </p>

      <div class="text-xs text-gray-500 bg-gray-50 rounded p-3">
        <p class="font-semibold mb-1">Columnas esperadas:</p>
        <template v-if="mode === 'prices'">
          <code>sku, precio_sin_igv, precio_con_igv</code>
          <p class="mt-1">Para variantes: <code>variante_sku, ...</code></p>
          <p class="mt-1">Si solo incluyes una columna de precio, el otro se calculara automaticamente.</p>
        </template>
        <template v-else>
          <code>sku, stock</code>
          <p class="mt-1">Para variantes: <code>variante_sku, stock</code></p>
        </template>
      </div>

      <FileUpload
        mode="basic"
        accept=".csv"
        :maxFileSize="5000000"
        :auto="false"
        chooseLabel="Seleccionar archivo CSV"
        class="w-full"
        @select="onFileSelect"
      />

      <p v-if="selectedFile" class="text-sm text-gray-700">
        <i class="pi pi-file mr-1"></i>
        {{ selectedFile.name }}
        <span class="text-gray-400">({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span>
      </p>
    </div>

    <!-- Step 2: Preview -->
    <div v-else-if="step === 2 && previewData" class="space-y-4">
      <!-- Summary -->
      <div class="flex gap-4 text-sm">
        <div class="bg-blue-50 rounded px-3 py-2">
          <span class="text-blue-700 font-semibold">{{ previewData.total_rows }}</span>
          <span class="text-blue-600 ml-1">filas</span>
        </div>
        <div class="bg-green-50 rounded px-3 py-2">
          <span class="text-green-700 font-semibold">{{ changesCount }}</span>
          <span class="text-green-600 ml-1">con cambios</span>
        </div>
        <div v-if="previewData.errors.length > 0" class="bg-red-50 rounded px-3 py-2">
          <span class="text-red-700 font-semibold">{{ previewData.errors.length }}</span>
          <span class="text-red-600 ml-1">errores</span>
        </div>
      </div>

      <!-- Errors -->
      <div
        v-if="previewData.errors.length > 0"
        class="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto"
      >
        <p
          v-for="err in previewData.errors"
          :key="err.row"
          class="text-sm text-red-700"
        >
          Fila {{ err.row }}: {{ err.message }}
        </p>
      </div>

      <!-- Preview table -->
      <DataTable
        :value="previewData.preview"
        :paginator="previewData.preview.length > 10"
        :rows="10"
        dataKey="row_number"
        size="small"
        class="text-sm"
        scrollable
        scrollHeight="300px"
      >
        <Column field="sku" header="SKU" style="min-width: 80px" />
        <Column field="name" header="Producto" style="min-width: 150px" />
        <Column v-if="previewData.preview.some(r => r.variant_sku)" field="variant_sku" header="Variante SKU" style="min-width: 80px" />
        <Column header="Actual" style="min-width: 80px">
          <template #body="{ data }">
            <span class="text-gray-600">{{ data.current_value }}</span>
          </template>
        </Column>
        <Column header="Nuevo" style="min-width: 80px">
          <template #body="{ data }">
            <span
              :class="data.has_change ? 'text-green-700 font-semibold' : 'text-gray-400'"
            >
              {{ data.new_value ?? '-' }}
            </span>
          </template>
        </Column>
        <Column header="" style="width: 60px">
          <template #body="{ data }">
            <Tag
              v-if="data.has_change"
              value="Cambio"
              severity="success"
              class="text-xs"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Step 3: Result -->
    <div v-else-if="step === 3 && importResult" class="text-center py-6">
      <i class="pi pi-check-circle text-5xl text-green-500 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Importacion completada</h3>
      <p class="text-gray-600">
        Se procesaron <strong>{{ importResult.processed }}</strong> filas
        y se actualizaron <strong>{{ importResult.updated }}</strong> registros.
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          v-if="step === 1"
          label="Cancelar"
          severity="secondary"
          @click="handleClose"
        />
        <Button
          v-if="step === 1"
          label="Analizar CSV"
          icon="pi pi-search"
          :loading="uploading"
          :disabled="!selectedFile"
          @click="handleUpload"
        />

        <Button
          v-if="step === 2"
          label="Volver"
          severity="secondary"
          @click="step = 1"
        />
        <Button
          v-if="step === 2"
          label="Confirmar Importacion"
          icon="pi pi-check"
          :loading="confirming"
          :disabled="changesCount === 0"
          @click="handleConfirm"
        />

        <Button
          v-if="step === 3"
          label="Cerrar"
          @click="handleClose"
        />
      </div>
    </template>
  </Dialog>
</template>
