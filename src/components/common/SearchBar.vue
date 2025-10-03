<template>
  <div class="relative">
    <span class="p-input-icon-left w-full">
      <i class="pi pi-search" />
      <InputText
        v-model="searchQuery"
        :placeholder="placeholder"
        class="w-full"
        @input="onSearchInput"
      />
    </span>
    <Button
      v-if="searchQuery"
      icon="pi pi-times"
      text
      rounded
      class="absolute right-2 top-1/2 -translate-y-1/2"
      @click="clearSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

interface Props {
  modelValue: string
  placeholder?: string
  debounce?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Buscar...',
  debounce: 500
})

const emit = defineEmits<Emits>()

const searchQuery = ref(props.modelValue)
let debounceTimeout: NodeJS.Timeout | null = null

watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue
})

const onSearchInput = () => {
  emit('update:modelValue', searchQuery.value)

  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }

  debounceTimeout = setTimeout(() => {
    emit('search', searchQuery.value)
  }, props.debounce)
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('update:modelValue', '')
  emit('search', '')
}
</script>
