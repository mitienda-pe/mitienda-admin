<template>
  <!-- Layout horizontal en desktop, vertical en móvil -->
  <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
    <div class="flex flex-col md:flex-row md:items-end gap-4">
      <!-- Estado de Publicación -->
      <div class="flex-1">
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
      <div class="flex-1">
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
      <div class="flex-1">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Categoría</label>
        <Dropdown
          v-model="localFilters.categoryId"
          :options="categoryOptions"
          option-label="path"
          option-value="id"
          placeholder="Todas"
          class="w-full"
          filter
          filter-placeholder="Buscar categoría"
          show-clear
          @change="applyFilters"
        >
          <template #option="{ option }">
            <span :style="{ paddingLeft: `${option.depth * 1.25}rem` }" :class="option.depth === 0 ? 'font-medium' : ''">
              <i v-if="option.depth > 0" class="pi pi-angle-right text-xs text-secondary-400 mr-1"></i>{{ option.name }}
            </span>
          </template>
        </Dropdown>
      </div>

      <!-- Marca -->
      <div class="flex-1">
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

      <!-- Tipo (producto / servicio) -->
      <div v-if="productTypeStore.publicTypes.length > 1" class="flex-1">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Tipo</label>
        <Dropdown
          v-model="localFilters.productTypeId"
          :options="productTypeStore.publicTypes"
          option-label="name"
          option-value="id"
          placeholder="Todos"
          class="w-full"
          show-clear
          @change="applyFilters"
        />
      </div>

      <!-- Botón limpiar -->
      <div>
        <Button label="Limpiar" icon="pi pi-filter-slash" outlined @click="clearFilters" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useCatalogStore } from '@/stores/catalog.store'
import { useProductTypeStore } from '@/stores/product-type.store'
import type { Category, ProductFilters } from '@/types/product.types'

interface Props {
  filters: ProductFilters
}

interface Emits {
  (e: 'update:filters', filters: ProductFilters): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const catalogStore = useCatalogStore()
const productTypeStore = useProductTypeStore()

onMounted(() => {
  productTypeStore.fetchTypes()
})

const localFilters = ref<ProductFilters>({ ...props.filters })

// Árbol de categorías aplanado en orden de lectura (padre, luego sus hijas) para
// poder filtrar también por subcategoría. `path` ("Padre › Hija") es lo que se
// ve en el campo ya elegido y sobre lo que busca el filtro del dropdown: así una
// subcategoría con nombre repetido ("Accesorios" en dos padres) no se confunde.
interface CategoryOption {
  id: number
  name: string
  path: string
  depth: number
}

const categoryOptions = computed<CategoryOption[]>(() => {
  const result: CategoryOption[] = []
  const walk = (items: Category[], depth: number, parentPath: string) => {
    for (const item of items) {
      const path = parentPath ? `${parentPath} › ${item.name}` : item.name
      result.push({ id: item.id, name: item.name, path, depth })
      if (item.sub?.length) walk(item.sub, depth + 1, path)
    }
  }
  walk(catalogStore.categories, 0, '')
  return result
})

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
    productTypeId: null,
    published: null,
    stockStatus: 'all'
  }
  applyFilters()
}
</script>
