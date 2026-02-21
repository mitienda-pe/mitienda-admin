<script setup lang="ts">
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'
import type { BulkProcessingResult } from '@/types/product.types'

interface Props {
  results: BulkProcessingResult[]
  totalValid: number
  processingIndex: number
  progressPercent: number
  isProcessing: boolean
  isPaused: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  pause: []
  resume: []
  cancel: []
}>()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-secondary-700">Procesando productos</h3>
      <p class="text-sm text-gray-500 mt-1">
        {{ isProcessing
          ? `Procesando producto ${processingIndex} de ${totalValid}...`
          : 'Procesamiento completado'
        }}
      </p>
    </div>

    <ProgressBar :value="progressPercent" :showValue="true" />

    <div v-if="isProcessing" class="flex gap-2 justify-center">
      <Button
        v-if="!isPaused"
        label="Pausar"
        icon="pi pi-pause"
        severity="warning"
        outlined
        @click="emit('pause')"
      />
      <Button
        v-else
        label="Reanudar"
        icon="pi pi-play"
        severity="success"
        outlined
        @click="emit('resume')"
      />
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="danger"
        outlined
        @click="emit('cancel')"
      />
    </div>

    <!-- Real-time results list -->
    <div class="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
      <div
        v-for="result in results"
        :key="result.rowNumber"
        class="px-4 py-2 border-b border-gray-100 last:border-b-0 flex items-start gap-3 text-sm"
      >
        <i
          :class="result.success ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"
          class="mt-0.5"
        />
        <div class="flex-1 min-w-0">
          <span class="text-gray-500">Fila {{ result.rowNumber }}:</span>
          <span v-if="result.success" class="text-green-700 ml-1">
            Producto "{{ result.productName }}" {{ result.action === 'created' ? 'creado' : 'actualizado' }}
            <span v-if="result.productId" class="text-gray-400">(ID: {{ result.productId }})</span>
          </span>
          <span v-else class="text-red-700 ml-1">
            {{ result.productName ? `"${result.productName}" - ` : '' }}{{ result.error }}
          </span>
        </div>
      </div>

      <div v-if="results.length === 0 && isProcessing" class="p-8 text-center text-gray-400">
        <i class="pi pi-spinner pi-spin text-2xl" />
      </div>
    </div>
  </div>
</template>
