<script setup lang="ts">
import { IMAGE_ASPECT_RATIO_OPTIONS } from '@/types/product-card.types'
import type { ImageAspectRatio } from '@/types/product-card.types'

interface Props {
  modelValue: ImageAspectRatio
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ImageAspectRatio]
}>()
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Proporción de imagen
    </label>
    <p class="text-xs text-gray-400 mb-3">
      Define la proporción de las fotos de producto en la viñeta y en el recorte de imágenes.
    </p>
    <div class="flex gap-3">
      <button
        v-for="option in IMAGE_ASPECT_RATIO_OPTIONS"
        :key="option.value"
        type="button"
        class="relative flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all cursor-pointer flex-1"
        :class="
          modelValue === option.value
            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
            : 'border-gray-200 bg-white hover:border-gray-300'
        "
        @click="emit('update:modelValue', option.value)"
      >
        <!-- Visual preview box -->
        <div
          class="bg-gray-200 rounded"
          :style="{ aspectRatio: option.cssRatio, width: option.value === '1/1' ? '48px' : '48px' }"
        />
        <span
          class="text-sm font-medium"
          :class="modelValue === option.value ? 'text-primary' : 'text-gray-600'"
        >
          {{ option.label }}
        </span>
        <span class="text-[10px] text-gray-400 leading-tight">
          {{ option.description }}
        </span>
        <i
          v-if="modelValue === option.value"
          class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
        />
      </button>
    </div>
  </div>
</template>
