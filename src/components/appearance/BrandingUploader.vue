<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ImageValidationRules } from '@/config/image-validation.config'
import { formatFileSize } from '@/config/image-validation.config'
import { AppButton } from '@/components/ui'

interface Props {
  currentUrl: string | null
  isUploading: boolean
  rules: ImageValidationRules
  label: string
  hint?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  upload: [file: File]
  delete: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const validationError = ref<string | null>(null)

const acceptFormats = computed(() => props.rules.allowedFormats.join(','))

const formatLabels = computed(() => {
  return props.rules.allowedFormats
    .map(f => {
      switch (f) {
        case 'image/jpeg': return 'JPG'
        case 'image/png': return 'PNG'
        case 'image/webp': return 'WebP'
        case 'image/svg+xml': return 'SVG'
        default: return f
      }
    })
    .join(', ')
})

const isSvg = computed(() => {
  if (!props.currentUrl) return false
  return props.currentUrl.includes('.svg')
})

function openFileDialog() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    handleFile(input.files[0])
  }
  input.value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function handleFile(file: File) {
  validationError.value = null

  if (!props.rules.allowedFormats.includes(file.type)) {
    validationError.value = `Formato no permitido. Usa: ${formatLabels.value}`
    return
  }

  if (file.size > props.rules.maxFileSize) {
    validationError.value = `El archivo es muy grande. Máximo ${formatFileSize(props.rules.maxFileSize)}`
    return
  }

  // SVG files skip dimension validation
  if (file.type === 'image/svg+xml') {
    emit('upload', file)
    return
  }

  // Validate raster image dimensions
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    if (img.width < props.rules.minWidth || img.height < props.rules.minHeight) {
      validationError.value = `La imagen debe ser al menos ${props.rules.minWidth}x${props.rules.minHeight}px`
      return
    }
    emit('upload', file)
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    validationError.value = 'No se pudo leer la imagen'
  }
  img.src = url
}

function onDelete() {
  validationError.value = null
  emit('delete')
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>

    <!-- Current image preview -->
    <div
      v-if="currentUrl && !isUploading"
      class="border border-gray-200 rounded-lg p-4 bg-white"
    >
      <div class="flex items-start gap-4">
        <div
          class="w-24 h-24 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
        >
          <img
            :src="currentUrl"
            :alt="label"
            class="max-w-full max-h-full object-contain"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-600 truncate">
            {{ currentUrl.split('/').pop()?.split('?')[0] }}
          </p>
          <p v-if="isSvg" class="text-xs text-gray-400 mt-0.5">SVG (vectorial)</p>
          <div class="flex gap-2 mt-3">
            <AppButton variant="outlined" size="small" @click="openFileDialog">
              Cambiar imagen
            </AppButton>
            <AppButton variant="text" size="small" class="text-red-600" @click="onDelete">
              Eliminar
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload zone (empty state or uploading) -->
    <div
      v-else
      class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
      :class="[
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
        isUploading ? 'pointer-events-none opacity-60' : ''
      ]"
      @click="openFileDialog"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <div v-if="isUploading" class="flex flex-col items-center">
        <i class="pi pi-spinner pi-spin text-3xl text-primary mb-2" />
        <p class="text-sm text-gray-500">Subiendo imagen...</p>
      </div>
      <div v-else class="flex flex-col items-center">
        <i class="pi pi-image text-3xl text-gray-300 mb-2" />
        <p class="text-sm text-gray-600">
          Arrastra una imagen aquí o <span class="text-primary font-medium">haz clic</span>
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ formatLabels }} · Máx {{ formatFileSize(rules.maxFileSize) }}
        </p>
      </div>
    </div>

    <!-- Validation error -->
    <p v-if="validationError" class="text-xs text-red-500 mt-1.5">
      <i class="pi pi-exclamation-circle mr-1" />{{ validationError }}
    </p>

    <!-- Hint -->
    <p v-if="hint" class="text-xs text-gray-400 mt-1.5">{{ hint }}</p>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      :accept="acceptFormats"
      class="hidden"
      @change="onFileSelected"
    />
  </div>
</template>
