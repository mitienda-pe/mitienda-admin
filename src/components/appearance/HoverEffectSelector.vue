<script setup lang="ts">
import { HOVER_EFFECT_OPTIONS } from '@/types/product-card.types'
import type { HoverEffect } from '@/types/product-card.types'

interface Props {
  modelValue: HoverEffect
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: HoverEffect]
}>()

const effectIcons: Record<HoverEffect, string> = {
  'translate-y': 'pi pi-arrow-up',
  'scale': 'pi pi-expand',
  'zoom': 'pi pi-search-plus',
  'ken-burns': 'pi pi-video',
  'combo': 'pi pi-bolt',
  'info-slide': 'pi pi-arrow-circle-up'
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Efecto hover
    </label>
    <p class="text-xs text-gray-400 mb-3">
      Animación al pasar el cursor sobre la tarjeta
    </p>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <button
        v-for="option in HOVER_EFFECT_OPTIONS"
        :key="option.value"
        type="button"
        class="relative p-4 border-2 rounded-lg text-left transition-all cursor-pointer"
        :class="
          modelValue === option.value
            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
            : 'border-gray-200 bg-white hover:border-gray-300'
        "
        @click="emit('update:modelValue', option.value)"
      >
        <i
          :class="effectIcons[option.value]"
          class="text-lg mb-2 block"
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
