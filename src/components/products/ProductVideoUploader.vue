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

const videoPreviewUrl = computed(() => {
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value)
  }
  return null
})

const acceptedFormats = '.mp4,.mov,.avi,.webm'
const maxFileSize = 100 * 1024 * 1024 // 100MB

const onFileSelect = (event: FileUploadSelectEvent) => {
  console.log('FileUpload event:', event)
  console.log('Files:', event.files)

  if (event.files && event.files.length > 0) {
    const file = event.files[0]
    console.log('Selected file:', file)
    console.log('File type:', file.type)
    console.log('File size:', file.size)
    console.log('Is File instance:', file instanceof File)

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
    console.log('File selected successfully:', selectedFile.value)
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    console.error('No file selected!')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  errorMessage.value = ''

  try {
    const { productsApi } = await import('@/api/products.api')

    // Step 1: Get upload link from API
    uploadProgress.value = 10
    const linkResponse = await productsApi.getVideoUploadLink(props.productId)

    if (!linkResponse.success || !linkResponse.data?.uploadURL) {
      throw new Error('Failed to get upload link')
    }

    const { uploadURL, uid } = linkResponse.data

    // Step 2: Upload directly to Cloudflare
    uploadProgress.value = 20

    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        // Map 0-100% upload to 20-80% total progress
        const uploadPercent = (e.loaded / e.total) * 100
        uploadProgress.value = 20 + (uploadPercent * 0.6)
      }
    })

    // Upload promise
    await new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response)
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })

      xhr.open('POST', uploadURL)
      xhr.send(formData)
    })

    // Step 3: Confirm upload with API (validates duration)
    uploadProgress.value = 90
    const confirmResponse = await productsApi.confirmVideoUpload(props.productId)

    uploadProgress.value = 100

    if (confirmResponse.success) {
      emit('upload-success', confirmResponse.data)
      setTimeout(() => {
        handleClose()
      }, 500)
    } else {
      throw new Error('Upload confirmation failed')
    }

  } catch (error: any) {
    console.error('Error uploading video:', error)
    errorMessage.value = error.response?.data?.message || error.message || 'Error al subir el video. Intente nuevamente.'
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
            v-if="videoPreviewUrl"
            :src="videoPreviewUrl"
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
