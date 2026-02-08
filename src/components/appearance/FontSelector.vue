<script setup lang="ts">
import { computed, ref } from 'vue'
import Dropdown from 'primevue/dropdown'
import { FONT_CATALOG, FONT_CATEGORY_LABELS } from '@/config/font-catalog'
import type { FontCategory } from '@/types/appearance.types'
import { loadGoogleFont } from '@/stores/typography.store'

interface Props {
  modelValue: string
  label: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const filterCategory = ref<FontCategory | ''>('')

const fontOptions = computed(() => {
  let fonts = FONT_CATALOG
  if (filterCategory.value) {
    fonts = fonts.filter(f => f.category === filterCategory.value)
  }
  return fonts.map(f => ({
    label: f.family,
    value: f.family,
    category: FONT_CATEGORY_LABELS[f.category],
    font: f,
  }))
})

const categoryOptions = computed(() => [
  { label: 'Todas', value: '' },
  ...Object.entries(FONT_CATEGORY_LABELS).map(([value, label]) => ({ label, value })),
])

function onFontSelect(event: { value: string }) {
  emit('update:modelValue', event.value)
  loadGoogleFont(event.value)
}

function onCategoryChange(event: { value: FontCategory | '' }) {
  filterCategory.value = event.value
}

// Preload the currently selected font
if (props.modelValue) {
  loadGoogleFont(props.modelValue)
}
</script>

<template>
  <div>
    <label class="block text-xs text-gray-500 mb-1">{{ label }}</label>
    <div class="flex gap-2">
      <Dropdown
        :modelValue="modelValue"
        :options="fontOptions"
        optionLabel="label"
        optionValue="value"
        :filter="true"
        filterPlaceholder="Buscar fuente..."
        placeholder="Seleccionar fuente"
        class="flex-1"
        @change="onFontSelect"
      >
        <template #value="{ value }">
          <span
            v-if="value"
            :style="{ fontFamily: `'${value}', sans-serif` }"
          >{{ value }}</span>
          <span v-else class="text-gray-400">Seleccionar fuente</span>
        </template>
        <template #option="{ option }">
          <div class="flex items-center justify-between w-full gap-2">
            <span
              :style="{ fontFamily: `'${option.label}', sans-serif` }"
              class="truncate"
            >{{ option.label }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ option.category }}</span>
          </div>
        </template>
      </Dropdown>
      <Dropdown
        :modelValue="filterCategory"
        :options="categoryOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Categoría"
        class="w-36"
        @change="onCategoryChange"
      />
    </div>
  </div>
</template>
