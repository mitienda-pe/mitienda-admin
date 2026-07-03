<template>
  <Dialog
    :visible="visible"
    modal
    header="Subir imágenes"
    :style="{ width: '640px' }"
    :closable="!isBusy"
    @update:visible="onVisibleChange"
  >
    <!-- Mode tabs -->
    <div class="flex gap-2 mb-5">
      <button
        type="button"
        class="flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors"
        :class="mode === 'individual'
          ? 'border-primary text-primary bg-primary/5'
          : 'border-gray-200 text-secondary-500 hover:bg-gray-50'"
        @click="mode = 'individual'"
      >
        <i class="pi pi-image mr-1"></i> Imagen individual
      </button>
      <button
        v-if="canBulk"
        type="button"
        class="flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors"
        :class="mode === 'zip'
          ? 'border-primary text-primary bg-primary/5'
          : 'border-gray-200 text-secondary-500 hover:bg-gray-50'"
        @click="mode = 'zip'"
      >
        <i class="pi pi-folder mr-1"></i> Lote (ZIP)
      </button>
    </div>

    <!-- ── Individual mode ────────────────────────────── -->
    <div v-if="mode === 'individual'">
      <FileUpload
        mode="basic"
        :auto="false"
        accept="image/jpeg,image/png,image/webp"
        :maxFileSize="MAX_IMAGE_BYTES"
        chooseLabel="Seleccionar imagen"
        :customUpload="true"
        @select="onIndividualSelect"
      />
      <p class="text-xs text-secondary-400 mt-2">
        Formatos JPG, PNG o WebP. Máximo 10&nbsp;MB por imagen.
      </p>

      <div v-if="individualFile" class="mt-4 flex items-center gap-3">
        <span class="text-sm text-secondary-700 truncate flex-1">{{ individualFile.name }}</span>
        <AppButton
          label="Subir"
          icon="pi pi-upload"
          size="small"
          :loading="galleryStore.isUploading"
          @click="doIndividualUpload"
        />
      </div>
    </div>

    <!-- ── ZIP mode ───────────────────────────────────── -->
    <div v-else-if="mode === 'zip'">
      <div v-if="!activeBatchId">
        <div class="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 text-sm text-secondary-600">
          <p class="font-medium text-secondary-700 mb-1">Vinculación automática por SKU</p>
          <p>
            Nombra cada imagen con el SKU del producto para vincularla automáticamente:
            <code class="bg-white px-1 rounded">SKU=1.jpg</code>,
            <code class="bg-white px-1 rounded">SKU=2.jpg</code>
            (varias imágenes por producto), o simplemente
            <code class="bg-white px-1 rounded">SKU.jpg</code>.
            Las imágenes sin coincidencia se guardan igual en la galería.
          </p>
        </div>

        <FileUpload
          mode="basic"
          :auto="false"
          accept=".zip,application/zip"
          :maxFileSize="MAX_ZIP_BYTES"
          chooseLabel="Seleccionar ZIP"
          :customUpload="true"
          @select="onZipSelect"
        />
        <p class="text-xs text-secondary-400 mt-2">
          Archivo .ZIP de máximo 50&nbsp;MB (JPG, PNG, GIF o WebP dentro del ZIP).
        </p>

        <div v-if="zipFile" class="mt-4 flex items-center gap-3">
          <span class="text-sm text-secondary-700 truncate flex-1">{{ zipFile.name }}</span>
          <AppButton
            label="Procesar ZIP"
            icon="pi pi-cog"
            size="small"
            :loading="galleryStore.isUploadingZip"
            @click="doZipUpload"
          />
        </div>
      </div>

      <!-- Progress / result -->
      <div v-else>
        <div v-if="isProcessing" class="text-center py-4">
          <ProgressBar :value="progressPercent" />
          <p class="text-sm text-secondary-500 mt-3">
            Procesando {{ status?.processed ?? 0 }} de {{ status?.total_images ?? 0 }} imágenes…
          </p>
        </div>

        <div v-else-if="status?.status === 'completed'">
          <Message severity="success" :closable="false" class="mb-3">
            Lote procesado: {{ status.total_images }} imágenes.
          </Message>
          <ul class="text-sm text-secondary-700 space-y-1">
            <li><i class="pi pi-check-circle text-primary mr-1"></i> Vinculadas a productos: <strong>{{ status.linked }}</strong></li>
            <li><i class="pi pi-image text-secondary-400 mr-1"></i> Sin coincidencia de SKU: <strong>{{ status.unmatched }}</strong></li>
            <li v-if="status.skipped_quota > 0"><i class="pi pi-exclamation-triangle text-amber-500 mr-1"></i> Omitidas por cuota del producto: <strong>{{ status.skipped_quota }}</strong></li>
          </ul>

          <details v-if="unmatchedSkus.length" class="mt-3 text-xs text-secondary-500">
            <summary class="cursor-pointer">Ver SKUs sin coincidencia ({{ unmatchedSkus.length }})</summary>
            <p class="mt-1 break-words">{{ unmatchedSkus.join(', ') }}</p>
          </details>
          <p v-if="status.details?.message" class="text-xs text-amber-600 mt-2">{{ status.details.message }}</p>

          <div class="mt-4 flex justify-end">
            <AppButton label="Subir otro ZIP" variant="outlined" size="small" @click="resetZip" />
          </div>
        </div>

        <div v-else-if="status?.status === 'failed'">
          <Message severity="error" :closable="false">
            {{ status.details?.message || 'El procesamiento del ZIP falló.' }}
          </Message>
          <div class="mt-4 flex justify-end">
            <AppButton label="Reintentar" variant="outlined" size="small" @click="resetZip" />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useImageGalleryStore } from '@/stores/image-gallery.store'
import { usePlanStore } from '@/stores/plan.store'
import { AppButton } from '@/components/ui'
import Dialog from 'primevue/dialog'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const galleryStore = useImageGalleryStore()
const planStore = usePlanStore()
const toast = useToast()

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_ZIP_BYTES = 50 * 1024 * 1024

const canBulk = computed(() => planStore.isModuleEnabled('mod_carga_imagenes_lote'))
const mode = ref<'individual' | 'zip'>('individual')

// Individual
const individualFile = ref<File | null>(null)
function onIndividualSelect(e: FileUploadSelectEvent) {
  individualFile.value = (e.files?.[0] as File) ?? null
}
async function doIndividualUpload() {
  if (!individualFile.value) return
  try {
    await galleryStore.uploadImage(individualFile.value)
    toast.add({ severity: 'success', summary: 'Imagen subida', life: 3000 })
    individualFile.value = null
    close()
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'No se pudo subir la imagen', life: 4000 })
  }
}

// ZIP
const zipFile = ref<File | null>(null)
const activeBatchId = ref<number | null>(null)
function onZipSelect(e: FileUploadSelectEvent) {
  zipFile.value = (e.files?.[0] as File) ?? null
}
async function doZipUpload() {
  if (!zipFile.value) return
  try {
    const batchId = await galleryStore.uploadZip(zipFile.value)
    activeBatchId.value = batchId
    galleryStore.pollZipStatus(batchId)
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'No se pudo subir el ZIP', life: 4000 })
  }
}
function resetZip() {
  galleryStore.stopZipPolling()
  activeBatchId.value = null
  zipFile.value = null
  galleryStore.zipStatus = null
}

const status = computed(() => galleryStore.zipStatus)
const isProcessing = computed(() => status.value?.status === 'pending' || status.value?.status === 'processing')
const progressPercent = computed(() => {
  const total = status.value?.total_images ?? 0
  if (!total) return 0
  return Math.round(((status.value?.processed ?? 0) / total) * 100)
})
const unmatchedSkus = computed(() => status.value?.details?.unmatched_skus ?? [])

const isBusy = computed(() => galleryStore.isUploading || galleryStore.isUploadingZip || isProcessing.value)

function close() {
  emit('update:visible', false)
}
function onVisibleChange(value: boolean) {
  if (!value && isBusy.value) return // block close mid-work
  emit('update:visible', value)
}

onBeforeUnmount(() => galleryStore.stopZipPolling())
</script>
