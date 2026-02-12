<script setup lang="ts">
import { BORDER_RADIUS_OPTIONS } from '@/types/product-card.types'
import type { BorderRadius } from '@/types/product-card.types'

interface Props {
  modelValue: BorderRadius
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: BorderRadius]
}>()
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Radio de borde
    </label>
    <p class="text-xs text-gray-400 mb-3">
      Controla el redondeo de las esquinas de la tarjeta
    </p>
    <div class="grid grid-cols-4 gap-3 max-w-lg">
      <button
        v-for="option in BORDER_RADIUS_OPTIONS"
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
        <!-- Preview square with actual radius -->
        <div
          class="w-10 h-10 mx-auto mb-2"
          :class="modelValue === option.value ? 'bg-primary/20' : 'bg-gray-200'"
          :style="{ borderRadius: `${option.value}px` }"
        />
        <span
          class="text-xs font-medium"
          :class="modelValue === option.value ? 'text-primary' : 'text-gray-600'"
        >
          {{ option.label }}
        </span>
        <i
          v-if="modelValue === option.value"
          class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
        />
      </button>
    </div>
  </div>
</template>
