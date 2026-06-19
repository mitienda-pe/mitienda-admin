<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { referralApi } from '@/api/referral.api'
import { generateCsvString, downloadCsv } from '@/utils/csv-helpers'
import type {
  ReferralImportPreview,
  ReferralImportResult,
  ReferralImportAction
} from '@/types/referral.types'

interface Props {
  visible: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  imported: []
}>()

const toast = useToast()

const step = ref<1 | 2 | 3>(1)
const uploading = ref(false)
const confirming = ref(false)
const selectedFile = ref<File | null>(null)
const previewData = ref<ReferralImportPreview | null>(null)
const importResult = ref<ReferralImportResult | null>(null)

const actionTag: Record<ReferralImportAction, { label: string; severity: string }> = {
  crear: { label: 'Crear', severity: 'success' },
  duplicado: { label: 'Duplicado', severity: 'warning' },
  error: { label: 'Error', severity: 'danger' }
}

const canConfirm = computed(() => (previewData.value?.resumen.crear ?? 0) > 0)

// ── Plantilla ──

const downloadTemplate = () => {
  const content = generateCsvString(
    ['nombre', 'codigo', 'activo'],
    [
      ['Dra. Ejemplo Apellido', '', '1'],
      ['Dr. Con Codigo Propio', 'micodigo123', '1']
    ]
  )
  downloadCsv(content, 'plantilla_referidos.csv')
}

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
    const response = await referralApi.importPreview(selectedFile.value)
    if (response.success && response.data) {
      previewData.value = response.data
      step.value = 2
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: response.message || 'No se pudo procesar el archivo', life: 5000 })
    }
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al procesar el CSV', life: 5000 })
  } finally {
    uploading.value = false
  }
}

const handleConfirm = async () => {
  if (!selectedFile.value) return

  confirming.value = true
  try {
    const response = await referralApi.importConfirm(selectedFile.value)
    if (response.success && response.data) {
      importResult.value = response.data
      step.value = 3
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: response.message || 'No se pudo completar la importación', life: 5000 })
    }
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al importar', life: 5000 })
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
    header="Importar Códigos de Referido"
    class="w-full md:w-[760px]"
    @update:visible="handleClose"
  >
    <!-- Step 1: Upload -->
    <div v-if="step === 1" class="space-y-4">
      <p class="text-sm text-secondary-600">
        Sube un archivo CSV para crear varios códigos de una vez. Los códigos que ya
        existan en tu tienda (o repetidos en el archivo) se omiten automáticamente.
      </p>

      <div class="text-xs text-secondary-500 bg-gray-50 rounded p-3">
        <p class="font-semibold mb-1">Columnas:</p>
        <code>nombre, codigo, activo</code>
        <ul class="mt-2 space-y-1 list-disc list-inside">
          <li><strong>nombre</strong> — obligatorio (2 a 200 caracteres).</li>
          <li><strong>codigo</strong> — opcional; si lo dejas vacío se genera uno automáticamente. Alfanumérico, 3 a 50 caracteres.</li>
          <li><strong>activo</strong> — opcional; <code>1</code> (activo, por defecto) o <code>0</code>.</li>
        </ul>
        <Button
          label="Descargar plantilla"
          icon="pi pi-download"
          text
          size="small"
          class="mt-2 !px-0"
          @click="downloadTemplate"
        />
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

      <p v-if="selectedFile" class="text-sm text-secondary-700">
        <i class="pi pi-file mr-1"></i>
        {{ selectedFile.name }}
        <span class="text-secondary-400">({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span>
      </p>
    </div>

    <!-- Step 2: Preview -->
    <div v-else-if="step === 2 && previewData" class="space-y-4">
      <div class="flex flex-wrap gap-3 text-sm">
        <div class="bg-gray-50 rounded px-3 py-2">
          <span class="font-semibold">{{ previewData.resumen.total }}</span>
          <span class="text-secondary-500 ml-1">filas</span>
        </div>
        <div class="bg-green-50 rounded px-3 py-2">
          <span class="text-green-700 font-semibold">{{ previewData.resumen.crear }}</span>
          <span class="text-green-600 ml-1">a crear</span>
        </div>
        <div class="bg-amber-50 rounded px-3 py-2">
          <span class="text-amber-700 font-semibold">{{ previewData.resumen.duplicados }}</span>
          <span class="text-amber-600 ml-1">duplicados</span>
        </div>
        <div class="bg-red-50 rounded px-3 py-2">
          <span class="text-red-700 font-semibold">{{ previewData.resumen.errores }}</span>
          <span class="text-red-600 ml-1">con error</span>
        </div>
      </div>

      <p v-if="!canConfirm" class="text-sm text-amber-700">
        No hay filas nuevas para crear. Revisa los duplicados y errores antes de continuar.
      </p>

      <DataTable
        :value="previewData.filas"
        :paginator="previewData.filas.length > 12"
        :rows="12"
        dataKey="linea"
        size="small"
        class="text-sm"
        scrollable
        scrollHeight="320px"
        stripedRows
      >
        <Column field="linea" header="Línea" style="width: 70px" />
        <Column field="nombre" header="Nombre" style="min-width: 180px" />
        <Column field="codigo" header="Código" style="min-width: 130px">
          <template #body="{ data }">
            <code v-if="data.codigo" class="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{{ data.codigo }}</code>
            <span v-else class="text-secondary-400 text-xs">(autogenerar)</span>
          </template>
        </Column>
        <Column header="Acción" style="width: 110px">
          <template #body="{ data }">
            <Tag :value="actionTag[data.accion as ReferralImportAction].label" :severity="actionTag[data.accion as ReferralImportAction].severity" />
          </template>
        </Column>
        <Column field="mensaje" header="Detalle" style="min-width: 160px">
          <template #body="{ data }">
            <span class="text-secondary-500 text-xs">{{ data.mensaje }}</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Step 3: Result -->
    <div v-else-if="step === 3 && importResult" class="text-center py-6">
      <i class="pi pi-check-circle text-5xl text-green-500 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">Importación completada</h3>
      <p class="text-secondary-600">
        Se crearon <strong>{{ importResult.creados }}</strong> códigos.
        <template v-if="importResult.omitidos > 0">
          Se omitieron <strong>{{ importResult.omitidos }}</strong> duplicados.
        </template>
        <template v-if="importResult.errores > 0">
          <strong>{{ importResult.errores }}</strong> filas tuvieron errores.
        </template>
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <template v-if="step === 1">
          <Button label="Cancelar" severity="secondary" text @click="handleClose" />
          <Button label="Analizar CSV" icon="pi pi-search" :loading="uploading" :disabled="!selectedFile" @click="handleUpload" />
        </template>
        <template v-else-if="step === 2">
          <Button label="Atrás" severity="secondary" text :disabled="confirming" @click="step = 1" />
          <Button
            :label="`Crear ${previewData?.resumen.crear ?? 0} códigos`"
            icon="pi pi-check"
            :loading="confirming"
            :disabled="!canConfirm"
            @click="handleConfirm"
          />
        </template>
        <template v-else>
          <Button label="Cerrar" @click="handleClose" />
        </template>
      </div>
    </template>
  </Dialog>
</template>
