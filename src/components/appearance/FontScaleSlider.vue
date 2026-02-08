<script setup lang="ts">
import Slider from 'primevue/slider'

interface Props {
  modelValue: number
}

defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function onSliderChange(val: number | number[]) {
  const v = Array.isArray(val) ? val[0] : val
  emit('update:modelValue', Math.round(v * 100) / 100)
}

const stops = [
  { value: 0.85, label: 'Pequeño' },
  { value: 1.0, label: 'Normal' },
  { value: 1.2, label: 'Grande' },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm font-medium text-gray-700">Escala Global</label>
      <span class="text-sm text-gray-500 font-mono">{{ modelValue.toFixed(2) }}</span>
    </div>
    <Slider
      :modelValue="modelValue"
      :min="0.85"
      :max="1.2"
      :step="0.05"
      class="w-full"
      @update:modelValue="onSliderChange"
    />
    <div class="flex justify-between mt-1">
      <span
        v-for="stop in stops"
        :key="stop.value"
        class="text-xs cursor-pointer"
        :class="modelValue === stop.value ? 'text-primary font-semibold' : 'text-gray-400'"
        @click="emit('update:modelValue', stop.value)"
      >{{ stop.label }}</span>
    </div>
  </div>
</template>
