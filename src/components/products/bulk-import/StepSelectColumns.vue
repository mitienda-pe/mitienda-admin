<script setup lang="ts">
import { computed } from 'vue'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { getColumnGroups, REQUIRED_COLUMNS } from '@/utils/csv-helpers'

interface Props {
  mode: 'create' | 'edit'
  selectedColumns: string[]
  pricingMode: number
  isDownloading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDownloading: false,
})
const emit = defineEmits<{
  'update:selectedColumns': [value: string[]]
  downloadTemplate: []
}>()

const groups = computed(() => getColumnGroups(props.mode))

// Columns that are always selected and locked
const lockedColumns = computed(() => {
  if (props.mode === 'create') return [...REQUIRED_COLUMNS]
  return ['nombre', 'sku'] // Always included as identifiers in edit mode
})

function isLocked(key: string): boolean {
  if (key === 'id') return props.mode === 'edit'
  return lockedColumns.value.includes(key)
}

function toggleColumn(key: string) {
  if (isLocked(key)) return
  const current = [...props.selectedColumns]
  const idx = current.indexOf(key)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(key)
  }
  emit('update:selectedColumns', current)
}

function isSelected(key: string): boolean {
  if (key === 'id') return props.mode === 'edit'
  return props.selectedColumns.includes(key)
}

const priceLabel = computed(() =>
  props.pricingMode === 1 ? 'Precio (sin IGV)' : 'Precio (con IGV)',
)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-secondary-700">
        {{ mode === 'create' ? 'Columnas de la plantilla' : 'Selecciona las columnas a editar' }}
      </h3>
      <p class="text-sm text-gray-500 mt-1">
        {{
          mode === 'create'
            ? 'Los campos obligatorios estan marcados. Puedes deseleccionar los opcionales que no necesites.'
            : 'Elige las columnas que deseas modificar. ID, Nombre y SKU se incluyen siempre como identificadores.'
        }}
      </p>
    </div>

    <div
      v-if="pricingMode === 1"
      class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700"
    >
      <i class="pi pi-info-circle mr-2" />
      Tu tienda usa precios <strong>sin IGV</strong>. La columna "precio" corresponde al precio
      base sin impuestos.
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="group in groups"
        :key="group.group"
        class="border border-gray-200 rounded-lg p-4"
      >
        <h4 class="font-semibold text-secondary-700 mb-3 text-sm uppercase tracking-wide">
          {{ group.group }}
        </h4>
        <div class="space-y-2">
          <div
            v-for="col in group.columns"
            :key="col.key"
            class="flex items-center gap-2"
          >
            <Checkbox
              :modelValue="isSelected(col.key)"
              :binary="true"
              :disabled="isLocked(col.key)"
              @update:modelValue="toggleColumn(col.key)"
            />
            <label
              class="text-sm cursor-pointer"
              :class="isLocked(col.key) ? 'text-gray-400' : 'text-secondary-700'"
              @click="toggleColumn(col.key)"
            >
              {{ col.key === 'precio' ? priceLabel : col.label }}
              <span v-if="col.required && mode === 'create'" class="text-red-500">*</span>
              <span v-if="isLocked(col.key) && mode === 'edit'" class="text-xs text-gray-400 ml-1">(identificador)</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center pt-4">
      <Button
        :label="mode === 'create' ? 'Descargar Plantilla CSV' : 'Descargar Plantilla con Datos'"
        icon="pi pi-download"
        :loading="isDownloading"
        @click="emit('downloadTemplate')"
      />
    </div>
  </div>
</template>
