<script setup lang="ts">
import { ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import Button from 'primevue/button'

interface Props {
  imageFile: File
  minWidth?: number
  minHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  minWidth: 600,
  minHeight: 600
})

const emit = defineEmits<{
  'crop-complete': [blob: Blob]
  'skip': []
  'cancel': []
}>()

const cropper = ref<InstanceType<typeof Cropper> | null>(null)
const imageUrl = ref<string>('')
const isCropping = ref(false)
const errorMessage = ref('')

// Load image URL
const loadImage = () => {
  if (props.imageFile) {
    imageUrl.value = URL.createObjectURL(props.imageFile)
  }
}

loadImage()

// Crop completed handler
const handleCrop = async () => {
  if (!cropper.value) return

  isCropping.value = true
  errorMessage.value = ''

  try {
    const { canvas } = cropper.value.getResult()

    if (!canvas) {
      throw new Error('No se pudo obtener el resultado del recorte')
    }

    // Validate cropped dimensions
    if (canvas.width < props.minWidth || canvas.height < props.minHeight) {
      errorMessage.value = `El recorte debe mantener un mínimo de ${props.minWidth}x${props.minHeight} píxeles`
      isCropping.value = false
      return
    }

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        emit('crop-complete', blob)
      } else {
        errorMessage.value = 'Error al procesar la imagen recortada'
      }
      isCropping.value = false
    }, props.imageFile.type, 0.95)

  } catch (error: any) {
    errorMessage.value = error.message || 'Error al recortar la imagen'
    isCropping.value = false
  }
}

const handleSkip = () => {
  emit('skip')
}

const handleCancel = () => {
  // Revoke object URL to free memory
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  emit('cancel')
}

// Stencil props for square cropping
const stencilProps = {
  aspectRatio: 1
}
</script>

<template>
  <div class="product-image-cropper">
    <div class="cropper-container">
      <Cropper
        ref="cropper"
        :src="imageUrl"
        :stencil-props="stencilProps"
        class="cropper"
      />
    </div>

    <div v-if="errorMessage" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ errorMessage }}</span>
    </div>

    <div class="info-message">
      <i class="pi pi-info-circle"></i>
      <span>Ajusta el área de recorte para crear una imagen cuadrada. Mínimo {{ minWidth }}x{{ minHeight }}px.</span>
    </div>

    <div class="actions">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="handleCancel"
        :disabled="isCropping"
      />
      <Button
        label="Usar imagen completa"
        icon="pi pi-arrow-right"
        severity="secondary"
        @click="handleSkip"
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
</template>

<style scoped>
.product-image-cropper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.error-message {
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

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
}
</style>
