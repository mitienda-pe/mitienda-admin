<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import SelectButton from 'primevue/selectbutton'
import ProductImageCropper from './ProductImageCropper.vue'
import ProductImageLibraryPicker from './ProductImageLibraryPicker.vue'
import { getValidationRules, formatFileSize } from '@/config/image-validation.config'
import type { GalleryImage } from '@/types/gallery-image.types'
import type { ProductImage } from '@/types/product.types'

interface Props {
  visible: boolean
  productId: number
  aspectRatio?: number
  linkedImages?: ProductImage[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'upload-success': [data: any]
  'upload-error': [error: string]
}>()

const validationRules = getValidationRules('products')

const selectedFile = ref<File | null>(null)
const croppedBlob = ref<Blob | null>(null)
const showCropper = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')

// 'upload' = subir un archivo nuevo; 'library' = vincular una imagen de Contenido › Imágenes
const mode = ref<'upload' | 'library'>('upload')
const modeOptions = [
  { label: 'Subir nueva', value: 'upload', icon: 'pi pi-upload' },
  { label: 'Elegir de la galería', value: 'library', icon: 'pi pi-images' },
]
const libraryImage = ref<GalleryImage | null>(null)
const isLinking = ref(false)
const isBusy = computed(() => isUploading.value || isLinking.value)

const handleModeChange = (value: 'upload' | 'library' | null) => {
  // SelectButton emite null al volver a pulsar la opción activa
  if (value) mode.value = value
  errorMessage.value = ''
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const imagePreviewUrl = computed(() => {
  if (croppedBlob.value) {
    return URL.createObjectURL(croppedBlob.value)
  }
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value)
  }
  return null
})

const acceptedFormats = validationRules.allowedFormats
  .map(f => {
    const ext = f.replace('image/', '.')
    // Add .jpg alias for .jpeg
    if (ext === '.jpeg') return '.jpeg,.jpg'
    return ext
  })
  .join(',')

/**
 * Validate image file
 */
const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  // Validate format
  if (!validationRules.allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no válido. Use: ${validationRules.allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`
    }
  }

  // Validate size
  if (file.size > validationRules.maxFileSize) {
    return {
      valid: false,
      error: `Archivo muy grande. Máximo ${formatFileSize(validationRules.maxFileSize)}`
    }
  }

  // Validate dimensions
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)

      if (img.width < validationRules.minWidth || img.height < validationRules.minHeight) {
        resolve({
          valid: false,
          error: `Imagen muy pequeña. Mínimo ${validationRules.minWidth}x${validationRules.minHeight} píxeles`
        })
      } else {
        resolve({ valid: true })
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      resolve({
        valid: false,
        error: 'No se pudo cargar la imagen'
      })
    }
    img.src = URL.createObjectURL(file)
  })
}

const onFileSelect = async (event: FileUploadSelectEvent) => {
  if (event.files && event.files.length > 0) {
    const file = event.files[0]
    errorMessage.value = ''

    // Validate
    const validation = await validateImage(file)
    if (!validation.valid) {
      errorMessage.value = validation.error || 'Error de validación'
      selectedFile.value = null
      return
    }

    selectedFile.value = file
    showCropper.value = true
  }
}

const handleCropComplete = (blob: Blob) => {
  croppedBlob.value = blob
  showCropper.value = false
}

const handleSkipCrop = () => {
  croppedBlob.value = null
  showCropper.value = false
}

const handleCancelCrop = () => {
  selectedFile.value = null
  croppedBlob.value = null
  showCropper.value = false
}

const handleRemoveFile = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  selectedFile.value = null
  croppedBlob.value = null
  showCropper.value = false
}

const handleUpload = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  uploadProgress.value = 0
  errorMessage.value = ''

  try {
    const { productsApi } = await import('@/api/products.api')

    // Use cropped blob if available, otherwise use original file
    const fileToUpload = croppedBlob.value
      ? new File([croppedBlob.value], selectedFile.value.name, { type: selectedFile.value.type })
      : selectedFile.value

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    const response = await productsApi.uploadImage(props.productId, fileToUpload)

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.success) {
      emit('upload-success', response.data)
      setTimeout(() => {
        handleClose()
      }, 500)
    } else {
      throw new Error(response.message || 'Upload failed')
    }

  } catch (error: any) {
    console.error('Error uploading image:', error)
    errorMessage.value = error.response?.data?.message || error.message || 'Error al subir la imagen'
    emit('upload-error', errorMessage.value)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const handleLink = async () => {
  const image = libraryImage.value
  if (!image || image.source === 'cloudflare') return

  isLinking.value = true
  errorMessage.value = ''

  try {
    const { productsApi } = await import('@/api/products.api')
    const response = await productsApi.linkImage(props.productId, { id: image.id, source: image.source })

    if (!response.success) {
      throw new Error(response.message || 'No se pudo vincular la imagen')
    }

    emit('upload-success', { ...response.data, linked: true })
    handleClose()
  } catch (error: any) {
    const data = error.response?.data
    errorMessage.value = data?.messages?.error || data?.message || error.message || 'No se pudo vincular la imagen'
    emit('upload-error', errorMessage.value)
  } finally {
    isLinking.value = false
  }
}

const handleClose = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  selectedFile.value = null
  croppedBlob.value = null
  showCropper.value = false
  errorMessage.value = ''
  uploadProgress.value = 0
  isUploading.value = false
  isLinking.value = false
  libraryImage.value = null
  mode.value = 'upload'
  dialogVisible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    header="Añadir imagen al producto"
    :style="{ width: mode === 'library' ? '760px' : '600px' }"
    :breakpoints="{ '768px': '95vw' }"
    :draggable="false"
    :closable="!isBusy"
    @hide="handleClose"
  >
    <div class="space-y-4">
      <SelectButton
        v-if="!selectedFile"
        :modelValue="mode"
        :options="modeOptions"
        optionLabel="label"
        optionValue="value"
        :disabled="isBusy"
        class="w-full"
        @update:modelValue="handleModeChange"
      >
        <template #option="{ option }">
          <i :class="option.icon" class="mr-2"></i>
          <span>{{ option.label }}</span>
        </template>
      </SelectButton>

      <!-- Vincular una imagen existente de la galería -->
      <ProductImageLibraryPicker
        v-if="mode === 'library'"
        v-model:selected="libraryImage"
        :linked-images="linkedImages"
        :min-width="validationRules.minWidth"
        :min-height="validationRules.minHeight"
      />

      <!-- Step 1: File selection -->
      <div v-else-if="!selectedFile" class="upload-area">
        <FileUpload
          mode="basic"
          :accept="acceptedFormats"
          :maxFileSize="validationRules.maxFileSize"
          :auto="false"
          chooseLabel="Seleccionar imagen"
          chooseIcon="pi pi-image"
          class="w-full"
          @select="onFileSelect"
        />
        <div class="upload-info">
          <p class="text-sm text-gray-600 mt-3">
            <strong>Formatos:</strong> JPG, PNG, WebP<br>
            <strong>Tamaño mínimo:</strong> <span class="text-primary font-semibold">{{ validationRules.minWidth }}x{{ validationRules.minHeight }} píxeles</span><br>
            <strong>Tamaño máximo:</strong> {{ formatFileSize(validationRules.maxFileSize) }}
          </p>
        </div>
      </div>

      <!-- Step 2: Cropper (if file selected) -->
      <div v-else-if="showCropper && selectedFile">
        <ProductImageCropper
          :image-file="selectedFile"
          :min-width="validationRules.minWidth"
          :min-height="validationRules.minHeight"
          :aspect-ratio="aspectRatio"
          @crop-complete="handleCropComplete"
          @skip="handleSkipCrop"
          @cancel="handleCancelCrop"
        />
      </div>

      <!-- Step 3: Preview and upload -->
      <div v-else-if="selectedFile" class="preview-area">
        <div class="preview-header">
          <h4 class="text-lg font-semibold">Vista previa</h4>
          <Button
            v-if="!isUploading"
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            @click="handleRemoveFile"
          />
        </div>

        <div class="preview-image">
          <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="Preview" />
        </div>

        <div class="preview-info">
          <div class="flex items-center gap-2">
            <i class="pi pi-image text-primary text-xl"></i>
            <div>
              <p class="font-medium">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          <div v-if="croppedBlob" class="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
            <i class="pi pi-check mr-1"></i>
            Recorte aplicado
          </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="isUploading" class="upload-progress">
          <ProgressBar :value="uploadProgress" />
          <p class="text-sm text-gray-700 text-center mt-2">
            <i class="pi pi-cloud-upload mr-1"></i>
            Subiendo imagen... {{ uploadProgress }}%
          </p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-box">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ errorMessage }}</p>
      </div>

      <!-- Info Message -->
      <div v-if="mode === 'upload'" class="info-box">
        <i class="pi pi-info-circle"></i>
        <p class="text-sm">
          Las imágenes se suben a Cloudflare Images para mejor rendimiento y disponibilidad.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          @click="handleClose"
          :disabled="isBusy"
        />
        <Button
          v-if="mode === 'library'"
          label="Vincular imagen"
          icon="pi pi-link"
          @click="handleLink"
          :disabled="!libraryImage || isLinking"
          :loading="isLinking"
        />
        <Button
          v-else-if="selectedFile && !showCropper"
          label="Subir imagen"
          icon="pi pi-upload"
          @click="handleUpload"
          :disabled="isUploading"
          :loading="isUploading"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #f8fafc;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: #94a3b8;
}

.upload-info {
  margin-top: 1rem;
}

.preview-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-image {
  width: 100%;
  max-height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.preview-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 6px;
}

.upload-progress {
  margin-top: 1rem;
}

.error-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

.info-box {
  display: flex;
  align-items: start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 0.875rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
