<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'

interface Props {
  visible: boolean
  productId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'upload-success': [data: any]
  'upload-error': [error: string]
}>()

const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const acceptedFormats = '.mp4,.mov,.avi,.webm'
const maxFileSize = 100 * 1024 * 1024 // 100MB

const onFileSelect = (event: FileUploadSelectEvent) => {
  if (event.files && event.files.length > 0) {
    const file = event.files[0]

    // Validate file size
    if (file.size > maxFileSize) {
      errorMessage.value = `El archivo es demasiado grande. Máximo 100MB permitidos.`
      selectedFile.value = null
      return
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!validTypes.includes(file.type)) {
      errorMessage.value = `Formato de video no válido. Use: MP4, MOV, AVI, o WebM`
      selectedFile.value = null
      return
    }

    selectedFile.value = file
    errorMessage.value = ''
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  uploadProgress.value = 0
  errorMessage.value = ''

  try {
    const { productsApi } = await import('@/api/products.api')

    // Simulate progress (real progress would need xhr upload events)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    const response = await productsApi.uploadVideo(props.productId, selectedFile.value)

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.success) {
      emit('upload-success', response.data)
      setTimeout(() => {
        handleClose()
      }, 500)
    } else {
      throw new Error('Upload failed')
    }

  } catch (error: any) {
    console.error('Error uploading video:', error)
    errorMessage.value = error.response?.data?.message || 'Error al subir el video. Intente nuevamente.'
    emit('upload-error', errorMessage.value)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const handleClose = () => {
  selectedFile.value = null
  errorMessage.value = ''
  uploadProgress.value = 0
  isUploading.value = false
  dialogVisible.value = false
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    header="Subir video del producto"
    :style="{ width: '500px' }"
    :closable="!isUploading"
    @hide="handleClose"
  >
    <div class="space-y-4">
      <!-- File Upload -->
      <div v-if="!selectedFile" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <FileUpload
          mode="basic"
          :accept="acceptedFormats"
          :maxFileSize="maxFileSize"
          :auto="false"
          chooseLabel="Seleccionar video"
          class="w-full"
          @select="onFileSelect"
        />
        <p class="text-sm text-gray-500 mt-3">
          Formatos: MP4, MOV, AVI, WebM<br>
          Tamaño máximo: 100MB<br>
          <span class="text-yellow-600">Duración máxima: 40 segundos (se recortará automáticamente)</span>
        </p>
      </div>

      <!-- Selected File Info -->
      <div v-else class="border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <i class="pi pi-video text-2xl text-primary"></i>
            <div>
              <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          <Button
            v-if="!isUploading"
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            @click="selectedFile = null"
          />
        </div>

        <!-- Video Preview -->
        <div v-if="selectedFile && !isUploading" class="mt-3">
          <video
            :src="URL.createObjectURL(selectedFile)"
            controls
            class="w-full rounded-lg max-h-48"
          />
        </div>

        <!-- Upload Progress -->
        <div v-if="isUploading" class="mt-3">
          <ProgressBar :value="uploadProgress" />
          <p class="text-sm text-gray-500 text-center mt-2">
            Subiendo video... {{ uploadProgress }}%
          </p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
        <div class="flex items-start">
          <i class="pi pi-exclamation-triangle mr-2 mt-0.5"></i>
          <p class="text-sm">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Info Message -->
      <div class="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3">
        <div class="flex items-start">
          <i class="pi pi-info-circle mr-2 mt-0.5"></i>
          <p class="text-sm">
            El video se procesará en segundo plano. Recibirá una notificación cuando esté listo.
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          @click="handleClose"
          :disabled="isUploading"
        />
        <Button
          label="Subir video"
          icon="pi pi-upload"
          @click="handleUpload"
          :disabled="!selectedFile || isUploading"
          :loading="isUploading"
        />
      </div>
    </template>
  </Dialog>
</template>
