<template>
  <div class="inline-edit-field">
    <div
      v-if="!isEditing"
      class="cursor-pointer px-3 py-2 rounded hover:bg-gray-50 transition-colors min-h-[38px] flex items-center text-sm"
      :class="{ 'text-gray-400 italic': !displayValue }"
      @click="startEditing"
    >
      {{ displayValue || placeholder }}
    </div>

    <div v-else class="relative">
      <input
        ref="inputRef"
        v-model="editValue"
        type="text"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :disabled="isSaving"
        class="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        :class="{
          'border-secondary-300': !isSaving && !error,
          'border-primary bg-primary/5': isSaving,
          'border-red-500 bg-red-50': error
        }"
        @keydown.enter="save"
        @keydown.esc="cancel"
        @blur="save"
      />

      <div v-if="isSaving" class="absolute right-3 top-1/2 -translate-y-1/2">
        <i class="pi pi-spin pi-spinner text-primary text-xs"></i>
      </div>
    </div>

    <div v-if="error" class="text-red-600 text-xs mt-1">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  modelValue: string | number | null
  placeholder?: string
  maxlength?: number
  onSave?: (value: string) => Promise<unknown>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Click para editar',
  maxlength: 60,
  onSave: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save', value: string): void
}>()

const isEditing = ref(false)
const isSaving = ref(false)
const editValue = ref<string>(props.modelValue !== null && props.modelValue !== undefined ? String(props.modelValue) : '')
const error = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const displayValue = ref<string>(editValue.value)

watch(
  () => props.modelValue,
  (newValue) => {
    const stringified = newValue !== null && newValue !== undefined ? String(newValue) : ''
    displayValue.value = stringified
    if (!isEditing.value) {
      editValue.value = stringified
    }
  }
)

function startEditing() {
  if (isSaving.value) return
  editValue.value = displayValue.value
  isEditing.value = true
  error.value = ''
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function cancel() {
  editValue.value = displayValue.value
  isEditing.value = false
  error.value = ''
}

async function save() {
  if (isSaving.value) return

  const original = displayValue.value
  if (editValue.value === original) {
    isEditing.value = false
    return
  }

  try {
    isSaving.value = true
    error.value = ''

    if (props.onSave) {
      await props.onSave(editValue.value)
    } else {
      emit('save', editValue.value)
    }

    displayValue.value = editValue.value
    emit('update:modelValue', editValue.value)
    isEditing.value = false
  } catch (err: any) {
    error.value = err?.message || 'Error al guardar'
  } finally {
    isSaving.value = false
  }
}
</script>
