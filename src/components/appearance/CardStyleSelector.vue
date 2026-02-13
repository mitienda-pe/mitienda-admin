<script setup lang="ts">
import { CARD_STYLE_OPTIONS } from '@/types/product-card.types'
import type { CardStyle } from '@/types/product-card.types'

interface Props {
  modelValue: CardStyle
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: CardStyle]
}>()

function previewClasses(style: CardStyle): string {
  switch (style) {
    case 'default':
      return 'bg-white shadow-sm rounded-lg'
    case 'bordered':
      return 'bg-white border border-gray-300 rounded-lg shadow-none'
    case 'border-image':
      return 'bg-transparent rounded-lg'
    case 'transparent-info':
      return 'bg-transparent rounded-lg'
    default:
      return 'bg-white shadow-sm rounded-lg'
  }
}

function previewImageClasses(style: CardStyle): string {
  const base = 'bg-gray-100'
  switch (style) {
    case 'border-image':
      return `${base} border border-gray-300 rounded`
    case 'transparent-info':
      return `${base} shadow-sm rounded`
    default:
      return base
  }
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Estilo de viñeta
    </label>
    <p class="text-xs text-gray-400 mb-3">
      Define la apariencia general de la tarjeta de producto
    </p>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button
        v-for="option in CARD_STYLE_OPTIONS"
        :key="option.value"
        type="button"
        class="relative p-3 border-2 rounded-lg text-center transition-all cursor-pointer"
        :class="
          modelValue === option.value
            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
            : 'border-gray-200 bg-white hover:border-gray-300'
        "
        @click="emit('update:modelValue', option.value)"
      >
        <!-- Mini card preview -->
        <div
          class="mx-auto mb-2 w-14 h-16 flex flex-col overflow-hidden"
          :class="previewClasses(option.value)"
        >
          <div
            class="flex-1 rounded-t"
            :class="previewImageClasses(option.value)"
          />
          <div class="h-4 px-1 py-0.5">
            <div
              class="h-1 w-8 rounded-full mb-0.5"
              :class="modelValue === option.value ? 'bg-primary/30' : 'bg-gray-200'"
            />
            <div
              class="h-1 w-5 rounded-full"
              :class="modelValue === option.value ? 'bg-primary/20' : 'bg-gray-100'"
            />
          </div>
        </div>
        <span
          class="text-xs font-medium block"
          :class="modelValue === option.value ? 'text-primary' : 'text-gray-600'"
        >
          {{ option.label }}
        </span>
        <span class="text-[10px] text-gray-400 block mt-0.5 leading-tight">
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
