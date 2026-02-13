<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { getValidationRules, formatFileSize } from '@/config/image-validation.config'
import type { AspectRatioPreset } from '@/types/carousel.types'

interface Props {
  visible: boolean
  deviceType: 'desktop' | 'mobile'
  preset: AspectRatioPreset
  slideId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  slideId: null
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'upload-success': [data: { blob: Blob; fileName: string }]
  'upload-error': [error: string]
}>()

const validationRules = computed(() =>
  getValidationRules(props.deviceType === 'desktop' ? 'carouselDesktop' : 'carouselMobile')
)

const selectedFile = ref<File | null>(null)
const croppedBlob = ref<Blob | null>(null)
const showCropper = ref(false)
const isCropping = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')
const cropper = ref<InstanceType<typeof Cropper> | null>(null)
const imageUrl = ref('')

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const stencilProps = computed(() => ({
  aspectRatio: props.preset.ratio
}))

const acceptedFormats = computed(() =>
  validationRules.value.allowedFormats
    .map(f => {
      const ext = f.replace('image/', '.')
      if (ext === '.jpeg') return '.jpeg,.jpg'
      return ext
    })
    .join(',')
)

const dialogHeader = computed(() =>
  props.deviceType === 'desktop'
    ? 'Imagen Desktop'
    : 'Imagen Mobile'
)

const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  const rules = validationRules.value

  if (!rules.allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no válido. Use: ${rules.allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`
    }
  }

  if (file.size > rules.maxFileSize) {
    return {
      valid: false,
      error: `Archivo muy grande. Máximo ${formatFileSize(rules.maxFileSize)}`
    }
  }

  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      if (img.width < rules.minWidth || img.height < rules.minHeight) {
        resolve({
          valid: false,
          error: `Imagen muy pequeña. Mínimo ${rules.minWidth}x${rules.minHeight} píxeles`
        })
      } else {
        resolve({ valid: true })
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      resolve({ valid: false, error: 'No se pudo cargar la imagen' })
    }
    img.src = URL.createObjectURL(file)
  })
}

const onFileSelect = async (event: FileUploadSelectEvent) => {
  if (event.files && event.files.length > 0) {
    const file = event.files[0]
    errorMessage.value = ''

    const validation = await validateImage(file)
    if (!validation.valid) {
      errorMessage.value = validation.error || 'Error de validación'
      selectedFile.value = null
      return
    }

    selectedFile.value = file
    imageUrl.value = URL.createObjectURL(file)
    showCropper.value = true
  }
}

const handleCrop = async () => {
  if (!cropper.value) return

  isCropping.value = true
  errorMessage.value = ''

  try {
    const { canvas } = cropper.value.getResult()

    if (!canvas) {
      throw new Error('No se pudo obtener el resultado del recorte')
    }

    canvas.toBlob(
      blob => {
        if (blob) {
          croppedBlob.value = blob
          showCropper.value = false
        } else {
          errorMessage.value = 'Error al procesar la imagen recortada'
        }
        isCropping.value = false
      },
      selectedFile.value?.type || 'image/jpeg',
      0.95
    )
  } catch (error: any) {
    errorMessage.value = error.message || 'Error al recortar la imagen'
    isCropping.value = false
  }
}

const handleCancelCrop = () => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  selectedFile.value = null
  croppedBlob.value = null
  showCropper.value = false
}

const handleRemoveFile = () => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
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
    const fileToUpload = croppedBlob.value
      ? new File([croppedBlob.value], selectedFile.value.name, { type: selectedFile.value.type })
      : selectedFile.value

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) uploadProgress.value += 10
    }, 200)

    emit('upload-success', { blob: fileToUpload as unknown as Blob, fileName: selectedFile.value.name })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    setTimeout(() => handleClose(), 500)
  } catch (error: any) {
    errorMessage.value = error.message || 'Error al subir la imagen'
    emit('upload-error', errorMessage.value)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const handleClose = () => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  selectedFile.value = null
  croppedBlob.value = null
  showCropper.value = false
  errorMessage.value = ''
  uploadProgress.value = 0
  isUploading.value = false
  dialogVisible.value = false
}

const previewUrl = computed(() => {
  if (croppedBlob.value) return URL.createObjectURL(croppedBlob.value)
  return null
})
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :header="dialogHeader"
    :style="{ width: '700px' }"
    :closable="!isUploading"
    @hide="handleClose"
  >
    <div class="space-y-4">
      <!-- Step 1: File selection -->
      <div v-if="!selectedFile" class="upload-area">
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
        <div class="mt-4">
          <p class="text-sm text-gray-600">
            <strong>Formato:</strong> JPG, PNG, WebP<br>
            <strong>Tamaño mínimo:</strong>
            <span class="text-primary font-semibold">{{ preset.width }}×{{ preset.height }} px</span>
            <span class="text-gray-500">({{ preset.value }})</span><br>
            <strong>Tamaño máximo:</strong> {{ formatFileSize(validationRules.maxFileSize) }}
          </p>
        </div>
      </div>

      <!-- Step 2: Cropper -->
      <div v-else-if="showCropper && selectedFile" class="cropper-section">
        <div class="cropper-container">
          <Cropper
            ref="cropper"
            :src="imageUrl"
            :stencil-props="stencilProps"
            class="cropper"
          />
        </div>

        <div class="info-message">
          <i class="pi pi-info-circle"></i>
          <span>
            Ajusta el área de recorte para {{ preset.value }}.
            Tamaño recomendado: {{ preset.width }}×{{ preset.height }} px.
          </span>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="handleCancelCrop"
            :disabled="isCropping"
          />
          <Button
            label="Aplicar recorte"
            icon="pi pi-check"
            @click="handleCrop"
            :loading="isCropping"
          />
        </div>
      </div>

      <!-- Step 3: Preview and confirm -->
      <div v-else-if="selectedFile" class="preview-area">
        <div class="flex justify-between items-center">
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
          <img v-if="previewUrl" :src="previewUrl" alt="Preview" />
        </div>

        <div class="preview-info">
          <div class="flex items-center gap-2">
            <i class="pi pi-image text-primary text-xl"></i>
            <div>
              <p class="font-medium">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          <div class="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
            <i class="pi pi-check mr-1"></i>
            Recorte aplicado ({{ preset.value }})
          </div>
        </div>

        <div v-if="isUploading" class="mt-4">
          <ProgressBar :value="uploadProgress" />
          <p class="text-sm text-gray-700 text-center mt-2">
            <i class="pi pi-cloud-upload mr-1"></i>
            Subiendo imagen... {{ uploadProgress }}%
          </p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="errorMessage" class="error-box">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ errorMessage }}</p>
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
          v-if="selectedFile && !showCropper"
          label="Confirmar"
          icon="pi pi-check"
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

.cropper-container {
  width: 100%;
  height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.cropper {
  width: 100%;
  height: 100%;
}

.preview-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-image {
  width: 100%;
  max-height: 350px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image img {
  max-width: 100%;
  max-height: 350px;
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

.info-message {
  display: flex;
  align-items: center;
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
