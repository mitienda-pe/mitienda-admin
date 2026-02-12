<script setup lang="ts">
import { BUTTON_TYPE_OPTIONS } from '@/types/product-card.types'
import type { ButtonType } from '@/types/product-card.types'

interface Props {
  modelValue: ButtonType
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ButtonType]
}>()
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Tipo de botón
    </label>
    <p class="text-xs text-gray-400 mb-3">
      Botón de acción que aparece en la tarjeta de producto
    </p>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <button
        v-for="option in BUTTON_TYPE_OPTIONS"
        :key="option.value"
        type="button"
        class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
        :class="
          modelValue === option.value
            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
            : 'border-gray-200 bg-white hover:border-gray-300'
        "
        @click="emit('update:modelValue', option.value)"
      >
        <i
          :class="option.icon"
          class="text-xl mb-2 block"
          :style="{ color: modelValue === option.value ? '#00b2a6' : '#6B7280' }"
        />
        <span
          class="text-sm font-medium block"
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
