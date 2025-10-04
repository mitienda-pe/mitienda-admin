<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <h1 class="text-3xl font-bold text-secondary">Productos</h1>
      <div class="text-sm text-secondary-500">
        {{ productsStore.pagination.total }} productos
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
          <!-- Grid de productos: 2 cols (sm), 3 cols (md), 4 cols (lg), 6 cols (xl) -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useProductsStore } from '@/stores/products.store'
import { useCatalogStore } from '@/stores/catalog.store'
import Message from 'primevue/message'
import Button from 'primevue/button'
import SearchBar from '@/components/common/SearchBar.vue'
import ProductCard from '@/components/products/ProductCard.vue'
import ProductFilters from '@/components/products/ProductFilters.vue'

const productsStore = useProductsStore()
const catalogStore = useCatalogStore()

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
