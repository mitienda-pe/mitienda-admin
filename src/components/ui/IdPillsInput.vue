<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string | null
  pattern: RegExp
  placeholder?: string
  formatHint?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  formatHint: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const inputValue = ref('')

const pills = computed(() => {
  if (!props.modelValue) return []
  return props.modelValue
    .split(',')
    .map(v => v.trim())
    .filter(v => v !== '')
})

const invalidPills = computed(() => {
  return pills.value.filter(p => !props.pattern.test(p))
})

const hasError = computed(() => invalidPills.value.length > 0)

function addPill() {
  const val = inputValue.value.trim()
  if (!val) return

  // Support pasting multiple comma-separated values
  const newIds = val
    .split(',')
    .map(v => v.trim())
    .filter(v => v !== '')

  const current = pills.value
  const unique = newIds.filter(id => !current.includes(id))
  if (unique.length === 0) {
    inputValue.value = ''
    return
  }

  const updated = [...current, ...unique]
  emit('update:modelValue', updated.join(','))
  inputValue.value = ''
}

function removePill(index: number) {
  const updated = pills.value.filter((_, i) => i !== index)
  emit('update:modelValue', updated.length > 0 ? updated.join(',') : null)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addPill()
  }
  if (event.key === 'Backspace' && inputValue.value === '' && pills.value.length > 0) {
    removePill(pills.value.length - 1)
  }
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') || ''
  if (text.includes(',')) {
    event.preventDefault()
    inputValue.value = text
    addPill()
  }
}
</script>

<template>
  <div>
    <div
      class="flex flex-wrap items-center gap-1.5 min-h-[38px] w-full border rounded-lg px-2.5 py-1.5 bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"
      :class="hasError ? 'border-red-300' : 'border-gray-300'"
      @click="($refs.input as HTMLInputElement)?.focus()"
    >
      <!-- Pills -->
      <span
        v-for="(pill, index) in pills"
        :key="index"
        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium"
        :class="
          pattern.test(pill)
            ? 'bg-primary/10 text-primary'
            : 'bg-red-50 text-red-600 border border-red-200'
        "
      >
        {{ pill }}
        <button
          type="button"
          class="ml-0.5 hover:opacity-70 transition-opacity"
          @click.stop="removePill(index)"
        >
          <i class="pi pi-times text-xs" />
        </button>
      </span>

      <!-- Input -->
      <input
        ref="input"
        v-model="inputValue"
        type="text"
        class="flex-1 min-w-[120px] border-0 outline-none text-sm bg-transparent p-0.5"
        :placeholder="pills.length === 0 ? placeholder : 'Agregar otro...'"
        @keydown="onKeydown"
        @paste="onPaste"
        @blur="addPill"
      />
    </div>

    <!-- Error message -->
    <p v-if="hasError" class="text-xs text-red-500 mt-1">
      <i class="pi pi-exclamation-circle mr-1" />{{ formatHint }}
    </p>
  </div>
</template>
