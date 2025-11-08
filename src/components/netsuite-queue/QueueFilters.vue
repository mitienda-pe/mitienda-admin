<script setup lang="ts">
import { ref, watch } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import type { JobStatus } from '@/types/netsuite-queue.types'

interface Props {
  modelValue: {
    queue?: string
    status: JobStatus
    limit: number
  }
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFilters = ref({ ...props.modelValue })

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    localFilters.value = { ...newValue }
  },
  { deep: true }
)

// Emit changes
function updateFilters() {
  emit('update:modelValue', localFilters.value)
}

function handleRefresh() {
  emit('refresh')
}

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'En Proceso', value: 'reserved' }
]

const limitOptions = [
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '200', value: 200 }
]
</script>

<template>
  <Card>
    <template #content>
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <!-- Queue Filter -->
        <div class="flex-1">
          <label for="queue-filter" class="block text-sm font-medium text-gray-700 mb-2">
            Cola
          </label>
          <InputText
            id="queue-filter"
            v-model="localFilters.queue"
            placeholder="ej: netsuite"
            class="w-full"
            @update:model-value="updateFilters"
          />
          <small class="text-gray-500">Deja vacío para ver todas las colas</small>
        </div>

        <!-- Status Filter -->
        <div class="flex-1">
          <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <Dropdown
            id="status-filter"
            v-model="localFilters.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Seleccionar estado"
            class="w-full"
            @update:model-value="updateFilters"
          />
        </div>

        <!-- Limit Filter -->
        <div class="flex-1">
          <label for="limit-filter" class="block text-sm font-medium text-gray-700 mb-2">
            Límite
          </label>
          <Dropdown
            id="limit-filter"
            v-model="localFilters.limit"
            :options="limitOptions"
            option-label="label"
            option-value="value"
            placeholder="Límite de resultados"
            class="w-full"
            @update:model-value="updateFilters"
          />
        </div>

        <!-- Refresh Button -->
        <div>
          <Button
            icon="pi pi-refresh"
            label="Actualizar"
            severity="secondary"
            @click="handleRefresh"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
