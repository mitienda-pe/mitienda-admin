<script setup lang="ts">
import { IMAGE_FIT_OPTIONS } from '@/types/product-card.types'
import type { ImageAspectRatio, ImageFit } from '@/types/product-card.types'

interface Props {
  modelValue: ImageFit
  aspectRatio: ImageAspectRatio
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ImageFit]
}>()
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Ajuste de la foto en la ficha del producto
    </label>
    <p class="text-xs text-gray-400 mb-3">
      Qué pasa con las fotos que no tienen la proporción elegida. En la viñeta del catálogo la
      foto siempre se muestra completa.
    </p>
    <div class="flex gap-3">
      <button
        v-for="option in IMAGE_FIT_OPTIONS"
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
        <!-- Caja con la proporción elegida y, dentro, una foto más alta que la caja -->
        <div
          class="relative flex items-center justify-center overflow-hidden rounded border border-gray-200 bg-white"
          :style="{ aspectRatio: aspectRatio === '4/5' ? '4 / 5' : '1 / 1', width: '48px' }"
        >
          <div
            class="bg-gray-300"
            :class="option.value === 'cover' ? 'w-full shrink-0' : 'h-full'"
            :style="{ aspectRatio: '2 / 3' }"
          />
        </div>
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
