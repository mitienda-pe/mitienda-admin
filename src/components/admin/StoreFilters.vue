<template>
  <div class="store-filters">
    <div class="p-4 bg-white border-b">
      <div class="flex flex-wrap gap-4">
        <!-- Búsqueda -->
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <input
            v-model="localFilters.search"
            type="text"
            placeholder="Nombre, URL, slug..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="emitFilters"
          />
        </div>

        <!-- Estado del Plan -->
        <div class="w-48">
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            v-model="localFilters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="emitFilters"
          >
            <option value="">Todos</option>
            <option value="active">Activo</option>
            <option value="expired">Vencido</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>

        <!-- Plan -->
        <div class="w-48">
          <label class="block text-sm font-medium text-gray-700 mb-1">Plan</label>
          <select
            v-model="localFilters.plan"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="emitFilters"
          >
            <option value="">Todos</option>
            <option value="micro">Micro</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <!-- Botones -->
        <div class="flex items-end gap-2">
          <button
            @click="emitFilters"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <i class="pi pi-search mr-2"></i>
            Buscar
          </button>
          <button
            @click="clearFilters"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            <i class="pi pi-times mr-2"></i>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AdminStoresFilters } from '@/types/admin.types'

interface Props {
  modelValue: AdminStoresFilters
}

interface Emits {
  (e: 'update:modelValue', value: AdminStoresFilters): void
  (e: 'filter'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFilters = ref<AdminStoresFilters>({ ...props.modelValue })

watch(
  () => props.modelValue,
  newValue => {
    localFilters.value = { ...newValue }
  },
  { deep: true }
)

function emitFilters() {
  emit('update:modelValue', { ...localFilters.value, page: 1 })
  emit('filter')
}

function clearFilters() {
  localFilters.value = {
    status: '',
    plan: '',
    search: '',
    page: 1
  }
  emitFilters()
}
</script>

<style scoped>
.store-filters {
  /* Estilos adicionales si es necesario */
}
</style>
