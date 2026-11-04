<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <h1 class="text-3xl font-bold text-secondary">Productos</h1>
      <div class="flex items-center gap-4">
        <span class="text-sm text-secondary-500">
          {{ productsStore.pagination.total }} productos
        </span>
        <SelectButton
          v-model="viewMode"
          :options="viewOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          aria-label="Modo de vista"
        >
          <template #option="{ option }">
            <i :class="option.icon" v-tooltip.bottom="option.label"></i>
          </template>
        </SelectButton>
        <Button
          label="Reindexar buscador"
          icon="pi pi-sync"
          outlined
          :loading="reindexing"
          @click="handleReindex"
          v-tooltip.bottom="'Actualiza el buscador con los últimos cambios de tu catálogo'"
        />
        <router-link :to="{ name: 'ProductCreate' }">
          <Button label="Crear producto" icon="pi pi-plus" />
        </router-link>
      </div>
    </div>

    <!-- Búsqueda -->
    <div class="mb-4">
      <SearchBar
        v-model="productsStore.filters.search"
        placeholder="Buscar productos por nombre o SKU..."
        @search="productsStore.setSearch"
      />
    </div>

    <!-- Filtros horizontales -->
    <ProductFilters
      :filters="productsStore.filters"
      @update:filters="productsStore.setFilters"
    />

    <!-- Lista de Productos -->
    <div>

        <!-- Loading inicial -->
        <div v-if="productsStore.isLoading && !productsStore.hasProducts" class="flex justify-center py-20">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>

        <!-- Error -->
        <Message v-else-if="productsStore.error" severity="error" :closable="false">
          {{ productsStore.error }}
        </Message>

        <!-- Lista con productos -->
        <div v-else-if="productsStore.hasProducts">
          <!-- Vista lista: tabla con selección para acciones masivas -->
          <template v-if="viewMode === 'list'">
            <div
              v-if="selected.length > 0"
              class="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 mb-3"
            >
              <span class="text-sm font-medium text-secondary">
                {{ selected.length }} {{ selected.length === 1 ? 'producto seleccionado' : 'productos seleccionados' }}
              </span>
              <div class="flex flex-wrap gap-2 ml-auto">
                <Button
                  label="Publicar"
                  icon="pi pi-eye"
                  size="small"
                  outlined
                  :loading="bulkRunning === 'publish'"
                  :disabled="!!bulkRunning"
                  @click="runBulk('publish')"
                />
                <Button
                  label="Ocultar"
                  icon="pi pi-eye-slash"
                  size="small"
                  outlined
                  :loading="bulkRunning === 'unpublish'"
                  :disabled="!!bulkRunning"
                  @click="runBulk('unpublish')"
                />
                <Button
                  label="Eliminar"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  outlined
                  :loading="bulkRunning === 'delete'"
                  :disabled="!!bulkRunning"
                  @click="confirmDelete"
                />
                <Button
                  label="Quitar selección"
                  size="small"
                  text
                  :disabled="!!bulkRunning"
                  @click="selected = []"
                />
              </div>
            </div>

            <ProductsTable v-model:selection="selected" :products="productsStore.products" />
          </template>

          <!-- Grid de productos: 2 cols (sm), 3 cols (md), 4 cols (lg), 6 cols (xl) -->
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            <ProductCard
              v-for="product in productsStore.products"
              :key="product.id"
              :product="product"
            />
          </div>

          <!-- Botón cargar más -->
          <div v-if="productsStore.pagination.hasMore" class="text-center">
            <Button
              label="Cargar más productos"
              icon="pi pi-arrow-down"
              :loading="productsStore.isLoading"
              outlined
              @click="productsStore.loadMore"
            />
          </div>

          <!-- Indicador de carga al hacer scroll -->
          <div v-else-if="productsStore.isLoading" class="text-center py-4">
            <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
          </div>

          <!-- Fin de resultados -->
          <div v-else class="text-center py-4 text-secondary-400">
            <i class="pi pi-check-circle mr-2"></i>
            Todos los productos cargados
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="bg-white rounded-lg shadow p-12 text-center">
          <i class="pi pi-inbox text-6xl text-secondary-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-secondary mb-2">No se encontraron productos</h3>
          <p class="text-secondary-500 mb-4">
            Intenta ajustar los filtros o la búsqueda
          </p>
          <Button label="Limpiar filtros" outlined @click="productsStore.resetFilters" />
        </div>
      </div>

    <BenefitSlot class="mt-6" placement="products" />
  </div>
</template>

<script setup lang="ts">
import BenefitSlot from '@/components/benefits/BenefitSlot.vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import SelectButton from 'primevue/selectbutton'
import type { Product } from '@/types/product.types'
import { useProductsStore } from '@/stores/products.store'
import { useCatalogStore } from '@/stores/catalog.store'
import { productsApi } from '@/api/products.api'
import Message from 'primevue/message'
import Button from 'primevue/button'
import SearchBar from '@/components/common/SearchBar.vue'
import ProductCard from '@/components/products/ProductCard.vue'
import ProductsTable from '@/components/products/ProductsTable.vue'
import ProductFilters from '@/components/products/ProductFilters.vue'

const productsStore = useProductsStore()
const catalogStore = useCatalogStore()
const toast = useToast()
const confirm = useConfirm()

// ── Modo de vista (galería / lista) ─────────────────────────────────
type ViewMode = 'grid' | 'list'
const VIEW_MODE_KEY = 'products:viewMode'
const viewOptions = [
  { value: 'grid', label: 'Galería', icon: 'pi pi-th-large' },
  { value: 'list', label: 'Lista', icon: 'pi pi-list' },
]

const readViewMode = (): ViewMode => {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}
const viewMode = ref<ViewMode>(readViewMode())
watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
    /* sin almacenamiento: el modo dura lo que la pestaña */
  }
  if (mode === 'grid') selected.value = []
})

// ── Acciones masivas ────────────────────────────────────────────────
type BulkAction = 'publish' | 'unpublish' | 'delete'
const selected = ref<Product[]>([])
const bulkRunning = ref<BulkAction | null>(null)

// Si cambian los filtros o la búsqueda, la lista se recarga y la selección
// apuntaría a productos que ya no se ven: se limpia.
watch(() => productsStore.filters, () => { selected.value = [] }, { deep: true })

const bulkMessages: Record<BulkAction, (n: number) => string> = {
  publish: n => `${n} ${n === 1 ? 'producto publicado' : 'productos publicados'}`,
  unpublish: n => `${n} ${n === 1 ? 'producto ocultado' : 'productos ocultados'}`,
  delete: n => `${n} ${n === 1 ? 'producto eliminado' : 'productos eliminados'}`,
}

const runBulk = async (action: BulkAction) => {
  if (!selected.value.length || bulkRunning.value) return
  bulkRunning.value = action
  try {
    const ids = selected.value.map(p => p.id)
    const result = await productsStore.batchAction(action, ids)
    if (!result.success) {
      toast.add({ severity: 'error', summary: 'Error', detail: result.message, life: 5000 })
      return
    }
    toast.add({
      severity: 'success',
      summary: 'Listo',
      detail: bulkMessages[action](result.updated)
        + (result.skipped ? ` (${result.skipped} omitidos)` : ''),
      life: 4000,
    })
    selected.value = []
  } finally {
    bulkRunning.value = null
  }
}

const confirmDelete = () => {
  const n = selected.value.length
  confirm.require({
    header: 'Eliminar productos',
    message: `¿Eliminar ${n} ${n === 1 ? 'producto' : 'productos'}? Dejarán de verse en la tienda y en el backoffice, y su SKU quedará libre.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => runBulk('delete'),
  })
}

// Reindexación del buscador (Meilisearch)
const reindexing = ref(false)

const handleReindex = async () => {
  if (reindexing.value) return
  reindexing.value = true
  try {
    const response = await productsApi.reindex()
    toast.add({
      severity: 'success',
      summary: 'Reindexación iniciada',
      detail: response.message || 'El buscador se actualizará en uno o dos minutos.',
      life: 5000,
    })
  } catch (err: any) {
    const status = err.response?.status
    toast.add({
      severity: status === 429 ? 'warn' : 'error',
      summary: status === 429 ? 'Espera un momento' : 'Error',
      detail: err.response?.data?.message || 'No se pudo iniciar la reindexación. Intenta nuevamente.',
      life: 5000,
    })
  } finally {
    reindexing.value = false
  }
}

// Scroll infinito
let scrollTimeout: NodeJS.Timeout | null = null

const handleScroll = () => {
  if (scrollTimeout) return

  scrollTimeout = setTimeout(() => {
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = document.documentElement.clientHeight

    // Si está cerca del final (200px antes)
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      productsStore.loadMore()
    }

    scrollTimeout = null
  }, 200)
}

onMounted(async () => {
  // Cargar catálogo (categorías y marcas) si aún no está cargado
  if (catalogStore.categories.length === 0) {
    await catalogStore.fetchAll()
  }

  // Cargar productos
  await productsStore.fetchProducts()

  // Agregar listener de scroll
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})
</script>
