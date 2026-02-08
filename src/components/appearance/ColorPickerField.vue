<script setup lang="ts">
import ColorPicker from 'primevue/colorpicker'

interface Props {
  modelValue: string
  label: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onPickerChange(event: { value: string }) {
  emit('update:modelValue', '#' + event.value)
}

function onHexInput(event: Event) {
  const input = event.target as HTMLInputElement
  let val = input.value.trim()
  if (!val.startsWith('#')) val = '#' + val
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    emit('update:modelValue', val.toUpperCase())
  }
}

function pickerValue(): string {
  return props.modelValue.replace('#', '')
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 min-w-0 flex-1">
      <div
        class="w-8 h-8 rounded border border-gray-300 shrink-0 cursor-pointer relative overflow-hidden"
        :style="{ backgroundColor: modelValue }"
      >
        <ColorPicker
          :modelValue="pickerValue()"
          @update:modelValue="onPickerChange({ value: $event as string })"
          class="absolute inset-0 opacity-0 w-full h-full"
        />
      </div>
      <div class="min-w-0 flex-1">
        <label class="block text-xs text-gray-500 mb-0.5">{{ label }}</label>
        <input
          type="text"
          :value="modelValue"
          @change="onHexInput"
          maxlength="7"
          class="w-full text-sm font-mono px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  </div>
</template>
