<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Steps from 'primevue/steps'
import Button from 'primevue/button'
import StepChooseAction from '@/components/products/bulk-import/StepChooseAction.vue'
import StepSelectColumns from '@/components/products/bulk-import/StepSelectColumns.vue'
import StepUploadCsv from '@/components/products/bulk-import/StepUploadCsv.vue'
import StepProcessing from '@/components/products/bulk-import/StepProcessing.vue'
import StepResults from '@/components/products/bulk-import/StepResults.vue'
import { useBulkImport } from '@/composables/useBulkImport'
import { REQUIRED_COLUMNS } from '@/utils/csv-helpers'

const router = useRouter()
const toast = useToast()

const {
  mode,
  step,
  selectedColumns,
  parsedRows,
  results,
  isProcessing,
  isPaused,
  processingIndex,
  isLoadingRef,
  pricingMode,
  validRows,
  summary,
  progressPercent,
  loadReferenceData,
  generateCreateTemplate,
  downloadEditTemplate,
  parseCsvFile,
  startProcessing,
  pauseProcessing,
  resumeProcessing,
  cancelProcessing,
  downloadErrorReport,
  reset,
} = useBulkImport()

const isParsing = ref(false)
const isDownloadingTemplate = ref(false)

const stepsItems = [
  { label: 'Accion' },
  { label: 'Columnas' },
  { label: 'Subir CSV' },
  { label: 'Procesar' },
  { label: 'Resultados' },
]

onMounted(async () => {
  await loadReferenceData()
})

// Reset columns when mode changes
watch(mode, () => {
  selectedColumns.value = [...REQUIRED_COLUMNS]
})

// Warn user before closing during processing
function beforeUnloadHandler(e: BeforeUnloadEvent) {
  if (isProcessing.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnloadHandler))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler))

// ── Navigation ──

function canGoNext(): boolean {
  if (step.value === 1) return true
  if (step.value === 2) return selectedColumns.value.length > 0
  if (step.value === 3) return validRows.value.length > 0
  return false
}

function goNext() {
  if (!canGoNext()) return

  if (step.value === 3) {
    // Start processing when advancing from upload step
    step.value = 4
    startProcessing().then(() => {
      step.value = 5
    })
    return
  }

  step.value++
}

function goBack() {
  if (step.value > 1 && !isProcessing.value) {
    step.value--
  }
}

// ── Template Download ──

async function handleDownloadTemplate() {
  isDownloadingTemplate.value = true
  try {
    if (mode.value === 'create') {
      generateCreateTemplate(selectedColumns.value)
    } else {
      await downloadEditTemplate(selectedColumns.value)
    }
    toast.add({
      severity: 'success',
      summary: 'Plantilla descargada',
      detail: 'La plantilla CSV se ha descargado correctamente',
      life: 3000,
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'No se pudo descargar la plantilla',
      life: 5000,
    })
  } finally {
    isDownloadingTemplate.value = false
  }
}

// ── File Upload ──

async function handleFileSelected(file: File) {
  isParsing.value = true
  try {
    await parseCsvFile(file)
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error al procesar CSV',
      detail: err.message,
      life: 5000,
    })
  } finally {
    isParsing.value = false
  }
}

// ── Results Actions ──

function handleNewImport() {
  reset()
}

function handleGoToProducts() {
  router.push({ name: 'Products' })
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <Button
          v-if="step <= 2 || step === 5"
          icon="pi pi-arrow-left"
          text
          rounded
          @click="step === 1 ? router.push({ name: 'Products' }) : goBack()"
        />
        <h1 class="text-2xl font-bold text-secondary-700">Importacion Masiva de Productos</h1>
      </div>
    </div>

    <!-- Loading reference data -->
    <div v-if="isLoadingRef" class="flex flex-col items-center justify-center py-16">
      <i class="pi pi-spinner pi-spin text-4xl text-primary mb-4" />
      <p class="text-gray-500">Cargando datos de referencia...</p>
    </div>

    <template v-else>
      <!-- Steps indicator -->
      <div class="mb-8">
        <Steps :model="stepsItems" :activeStep="step - 1" :readonly="true" />
      </div>

      <!-- Step content -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <StepChooseAction
          v-if="step === 1"
          :mode="mode"
          @update:mode="mode = $event"
        />

        <StepSelectColumns
          v-else-if="step === 2"
          :mode="mode"
          :selectedColumns="selectedColumns"
          :pricingMode="pricingMode"
          :isDownloading="isDownloadingTemplate"
          @update:selectedColumns="selectedColumns = $event"
          @downloadTemplate="handleDownloadTemplate"
        />

        <StepUploadCsv
          v-else-if="step === 3"
          :mode="mode"
          :parsedRows="parsedRows"
          :isLoading="isParsing"
          @fileSelected="handleFileSelected"
        />

        <StepProcessing
          v-else-if="step === 4"
          :results="results"
          :totalValid="validRows.length"
          :processingIndex="processingIndex"
          :progressPercent="progressPercent"
          :isProcessing="isProcessing"
          :isPaused="isPaused"
          @pause="pauseProcessing"
          @resume="resumeProcessing"
          @cancel="cancelProcessing"
        />

        <StepResults
          v-else-if="step === 5"
          :results="results"
          :summary="summary"
          :mode="mode"
          @downloadErrors="downloadErrorReport"
          @newImport="handleNewImport"
          @goToProducts="handleGoToProducts"
        />
      </div>

      <!-- Navigation buttons -->
      <div
        v-if="step <= 3"
        class="flex justify-between mt-6"
      >
        <Button
          v-if="step > 1"
          label="Anterior"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="goBack"
        />
        <div v-else />
        <Button
          :label="step === 3 ? `Procesar ${validRows.length} productos` : 'Siguiente'"
          :icon="step === 3 ? 'pi pi-play' : 'pi pi-arrow-right'"
          iconPos="right"
          :disabled="!canGoNext()"
          @click="goNext"
        />
      </div>
    </template>
  </div>
</template>
