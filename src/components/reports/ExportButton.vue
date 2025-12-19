<template>
  <div class="flex items-center gap-3">
    <!-- Export Format Selector -->
    <div class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
      <label class="text-sm font-medium text-secondary-700">Formato:</label>
      <div class="flex gap-2">
        <label
          v-for="format in exportFormats"
          :key="format.value"
          class="flex items-center gap-1 cursor-pointer"
        >
          <input
            type="radio"
            :value="format.value"
            v-model="selectedFormat"
            class="text-primary focus:ring-primary"
          />
          <span class="text-sm text-secondary-700">{{ format.label }}</span>
        </label>
      </div>
    </div>

    <!-- Export Button -->
    <AppButton
      :label="loading ? 'Exportando...' : 'Exportar'"
      :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-download'"
      @click="handleExport"
      :disabled="disabled || loading || !hasData"
      :loading="loading"
    />
  </div>

  <div v-if="!hasData && !disabled" class="mt-2">
    <p class="text-sm text-orange-600">
      <i class="pi pi-info-circle mr-1"></i>
      No hay datos para exportar. Aplica filtros primero.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AppButton } from '@/components/ui'
import { ExportFormat } from '@/types/report.types'

interface Props {
  loading?: boolean
  disabled?: boolean
  hasData?: boolean
  defaultFormat?: ExportFormat
}

interface Emits {
  (e: 'export', format: ExportFormat): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  hasData: false,
  defaultFormat: ExportFormat.CSV
})

const emit = defineEmits<Emits>()

const exportFormats = [
  { label: 'CSV', value: ExportFormat.CSV },
  { label: 'Excel', value: ExportFormat.XLSX }
]

const selectedFormat = ref<ExportFormat>(props.defaultFormat)

const handleExport = () => {
  emit('export', selectedFormat.value)
}
</script>
