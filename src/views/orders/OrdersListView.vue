<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useOrdersStore } from '@/stores/orders.store'
import SearchBar from '@/components/common/SearchBar.vue'
import OrderCard from '@/components/orders/OrderCard.vue'
import OrderFilters from '@/components/orders/OrderFilters.vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import type { Order } from '@/types/order.types'
import type { OrderFiltersData } from '@/components/orders/OrderFilters.vue'

const router = useRouter()
const toast = useToast()
const ordersStore = useOrdersStore()

const filters = ref<OrderFiltersData>({
  status: 'all',
  dateFrom: null,
  dateTo: null
})

let debounceTimeout: NodeJS.Timeout | null = null

onMounted(() => {
  ordersStore.fetchOrders()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
})

const handleSearch = (query: string) => {
  ordersStore.setSearch(query)
}

const handleFiltersChange = (newFilters: OrderFiltersData) => {
  // Convertir Date a string ISO para la API
  const dateFrom = newFilters.dateFrom
    ? newFilters.dateFrom.toISOString().split('T')[0]
    : null
  const dateTo = newFilters.dateTo ? newFilters.dateTo.toISOString().split('T')[0] : null

  ordersStore.setFilters({
    status: newFilters.status,
    dateFrom,
    dateTo
  })
}

const handleClearFilters = () => {
  filters.value = {
    status: 'all',
    dateFrom: null,
    dateTo: null
  }
  ordersStore.resetFilters()
}

const handleOrderClick = (order: Order) => {
  // TODO: El endpoint /orders/{id} tiene un error en la API (tabla tiendasproductos no existe)
  // Temporalmente deshabilitado hasta que se corrija en el backend
  toast.add({
    severity: 'info',
    summary: 'Detalle de pedido',
    detail: `Pedido #${order.order_number} - ${order.customer.name}`,
    life: 3000
  })

  // Descomentar cuando la API esté corregida:
  // router.push(`/orders/${order.id}`)
}

const handleLoadMore = () => {
  ordersStore.loadMore()
}

const handleScroll = () => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }

  debounceTimeout = setTimeout(() => {
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = document.documentElement.clientHeight

    // Cargar más cuando está a 200px del final
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      ordersStore.loadMore()
    }
  }, 200)
}

const totalOrders = computed(() => ordersStore.pagination.total)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Pedidos</h1>
        <p v-if="!ordersStore.isLoading" class="text-gray-600 mt-1">
          {{ totalOrders }} {{ totalOrders === 1 ? 'pedido' : 'pedidos' }}
        </p>
      </div>
    </div>

    <!-- Búsqueda -->
    <SearchBar
      v-model="ordersStore.filters.search"
      placeholder="Buscar por número de pedido o cliente..."
      @search="handleSearch"
    />

    <!-- Grid: Filtros + Lista -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sidebar: Filtros -->
      <aside class="lg:col-span-1">
        <OrderFilters
          v-model="filters"
          @update:model-value="handleFiltersChange"
          @clear="handleClearFilters"
        />
      </aside>

      <!-- Lista de Pedidos -->
      <div class="lg:col-span-3">
        <!-- Loading inicial -->
        <div
          v-if="ordersStore.isLoading && !ordersStore.hasOrders"
          class="flex justify-center items-center py-12"
        >
          <ProgressSpinner />
        </div>

        <!-- Error -->
        <div
          v-else-if="ordersStore.error"
          class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
        >
          <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
          <p class="text-red-700">{{ ordersStore.error }}</p>
          <Button
            label="Reintentar"
            icon="pi pi-refresh"
            class="mt-4"
            @click="ordersStore.fetchOrders()"
          />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!ordersStore.hasOrders"
          class="bg-white border border-gray-200 rounded-lg p-12 text-center"
        >
          <i class="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay pedidos</h3>
          <p class="text-gray-600 mb-4">
            No se encontraron pedidos con los filtros seleccionados
          </p>
          <Button
            v-if="
              ordersStore.filters.search ||
              ordersStore.filters.status !== 'all' ||
              ordersStore.filters.dateFrom ||
              ordersStore.filters.dateTo
            "
            label="Limpiar filtros"
            icon="pi pi-filter-slash"
            @click="handleClearFilters"
          />
        </div>

        <!-- Grid de Pedidos -->
        <div v-else class="space-y-4">
          <OrderCard
            v-for="order in ordersStore.orders"
            :key="order.id"
            :order="order"
            @click="handleOrderClick"
          />

          <!-- Loading más pedidos -->
          <div v-if="ordersStore.isLoading" class="flex justify-center py-6">
            <ProgressSpinner style="width: 40px; height: 40px" />
          </div>

          <!-- Botón Cargar Más -->
          <div
            v-if="ordersStore.pagination.hasMore && !ordersStore.isLoading"
            class="flex justify-center py-6"
          >
            <Button
              label="Cargar más pedidos"
              icon="pi pi-chevron-down"
              outlined
              @click="handleLoadMore"
            />
          </div>

          <!-- Fin de resultados -->
          <div
            v-if="!ordersStore.pagination.hasMore && ordersStore.hasOrders"
            class="text-center py-6 text-gray-500"
          >
            <i class="pi pi-check-circle mr-2"></i>
            Has visto todos los pedidos
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
