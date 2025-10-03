<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between">
        <span class="text-lg">Filtros</span>
        <Button label="Limpiar" text size="small" @click="clearFilters" />
      </div>
    </template>

    <template #content>
      <div class="space-y-4">
        <!-- Estado de Publicación -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">Estado</label>
          <Dropdown
            v-model="localFilters.published"
            :options="publishedOptions"
            option-label="label"
            option-value="value"
            placeholder="Todos"
            class="w-full"
            @change="applyFilters"
          />
        </div>

        <!-- Estado de Stock -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">Stock</label>
          <Dropdown
            v-model="localFilters.stockStatus"
            :options="stockOptions"
            option-label="label"
            option-value="value"
            placeholder="Todos"
            class="w-full"
            @change="applyFilters"
          />
        </div>

        <!-- Categoría -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">Categoría</label>
          <Dropdown
            v-model="localFilters.categoryId"
            :options="catalogStore.categories"
            option-label="name"
            option-value="id"
            placeholder="Todas"
            class="w-full"
            show-clear
            @change="applyFilters"
          />
        </div>

        <!-- Marca -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">Marca</label>
          <Dropdown
            v-model="localFilters.brandId"
            :options="catalogStore.brands"
            option-label="name"
            option-value="id"
            placeholder="Todas"
            class="w-full"
            show-clear
            @change="applyFilters"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useCatalogStore } from '@/stores/catalog.store'
import type { ProductFilters } from '@/types/product.types'

interface Props {
  filters: ProductFilters
}

interface Emits {
  (e: 'update:filters', filters: ProductFilters): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const catalogStore = useCatalogStore()

const localFilters = ref<ProductFilters>({ ...props.filters })

const publishedOptions = [
  { label: 'Todos', value: null },
  { label: 'Publicados', value: true },
  { label: 'No publicados', value: false }
]

const stockOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'En stock', value: 'in_stock' },
  { label: 'Stock limitado', value: 'limited' },
  { label: 'Agotados', value: 'out_of_stock' }
]

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })

const applyFilters = () => {
  emit('update:filters', { ...localFilters.value })
}

const clearFilters = () => {
  localFilters.value = {
    search: '',
    categoryId: null,
    brandId: null,
    published: null,
    stockStatus: 'all'
  }
  applyFilters()
}
</script>
