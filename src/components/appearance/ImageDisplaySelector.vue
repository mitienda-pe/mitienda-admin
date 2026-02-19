<script setup lang="ts">
import { IMAGE_DISPLAY_OPTIONS } from '@/types/product-card.types'
import type { ImageDisplay } from '@/types/product-card.types'
import InputSwitch from 'primevue/inputswitch'

interface Props {
  modelValue: ImageDisplay
  showColorSwatches: boolean
  showSizeButtons: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ImageDisplay]
  'update:showColorSwatches': [value: boolean]
  'update:showSizeButtons': [value: boolean]
}>()
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Imágenes múltiples
    </label>
    <p class="text-xs text-gray-400 mb-3">
      Cómo se muestran las imágenes cuando un producto tiene más de una.
      Solo aplica a productos con múltiples fotos.
    </p>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button
        v-for="option in IMAGE_DISPLAY_OPTIONS"
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

    <!-- Product Attributes: Colors & Sizes -->
    <div class="mt-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Atributos del producto
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Muestra opciones como colores y tallas directamente en la tarjeta.
        Requiere que el producto tenga variantes con atributos configurados.
      </p>
      <div class="space-y-3 max-w-sm">
        <div
          class="flex items-center justify-between p-4 border-2 rounded-lg transition-all"
          :class="
            showColorSwatches
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 bg-white'
          "
        >
          <div class="flex items-center gap-3">
            <i
              class="pi pi-palette text-xl"
              :class="showColorSwatches ? 'text-primary' : 'text-gray-400'"
            />
            <div>
              <span
                class="text-sm font-medium block"
                :class="showColorSwatches ? 'text-primary' : 'text-gray-600'"
              >
                Colores
              </span>
              <span class="text-[10px] text-gray-400 block mt-0.5 leading-tight">
                Selector de colores con cambio de imagen
              </span>
            </div>
          </div>
          <InputSwitch
            :modelValue="showColorSwatches"
            @update:modelValue="emit('update:showColorSwatches', $event)"
          />
        </div>
        <div
          class="flex items-center justify-between p-4 border-2 rounded-lg transition-all"
          :class="
            showSizeButtons
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 bg-white'
          "
        >
          <div class="flex items-center gap-3">
            <i
              class="pi pi-list text-xl"
              :class="showSizeButtons ? 'text-primary' : 'text-gray-400'"
            />
            <div>
              <span
                class="text-sm font-medium block"
                :class="showSizeButtons ? 'text-primary' : 'text-gray-600'"
              >
                Tallas
              </span>
              <span class="text-[10px] text-gray-400 block mt-0.5 leading-tight">
                Botones de selección de tallas
              </span>
            </div>
          </div>
          <InputSwitch
            :modelValue="showSizeButtons"
            @update:modelValue="emit('update:showSizeButtons', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
