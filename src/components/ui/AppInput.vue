<script setup lang="ts">
import InputText from 'primevue/inputtext'
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  error?: string | boolean
  helpText?: string
  label?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}>()

const hasError = computed(() => {
  return typeof props.error === 'string' ? props.error.length > 0 : props.error
})

const errorMessage = computed(() => {
  return typeof props.error === 'string' ? props.error : ''
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-secondary-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Input -->
    <InputText
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'w-full',
        hasError ? 'p-invalid' : ''
      ]"
      @input="handleInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />

    <!-- Help text -->
    <small v-if="helpText && !hasError" class="text-secondary-500 block mt-1">
      {{ helpText }}
    </small>

    <!-- Error message -->
    <small v-if="hasError && errorMessage" class="text-red-500 block mt-1">
      {{ errorMessage }}
    </small>
  </div>
</template>

<style scoped>
/* Estilos específicos si necesitas override de PrimeVue */
</style>
