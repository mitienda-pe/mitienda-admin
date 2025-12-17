<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAbandonedCartsStore } from '@/stores/abandoned-carts.store'
import type { AbandonedCart } from '@/types/abandoned-cart.types'
import SearchBar from '@/components/common/SearchBar.vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const cartsStore = useAbandonedCartsStore()

const dateRange = ref<Date[]>([])
const showDetailDialog = ref(false)
const selectedCartId = ref<number | null>(null)

const customerTypeOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Registrados', value: '1' },
  { label: 'Invitado', value: '2' }
]

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Abandonados', value: '0' },
  { label: 'Recuperados', value: '1' },
  { label: 'Pendientes', value: '2' }
]

const channelOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Orgánico', value: '1' },
  { label: 'Doppler', value: '2' }
]

let debounceTimeout: NodeJS.Timeout | null = null

onMounted(() => {
  // Set default date range to last 30 days
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)
  dateRange.value = [thirtyDaysAgo, today]

  // Set initial filters
  cartsStore.setDateRange(
    thirtyDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  )

  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
})

const handleSearch = (query: string) => {
  cartsStore.setSearch(query)
}

const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    const [from, to] = dateRange.value
    cartsStore.setDateRange(from.toISOString().split('T')[0], to.toISOString().split('T')[0])
  }
}

const handleCustomerTypeChange = () => {
  cartsStore.fetchCarts()
}

const handleStatusChange = () => {
  cartsStore.fetchCarts()
}

const handleChannelChange = () => {
  cartsStore.fetchCarts()
}

const handleClearFilters = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)
  dateRange.value = [thirtyDaysAgo, today]

  cartsStore.resetFilters()
  cartsStore.setDateRange(
    thirtyDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  )
}

const handleCartClick = (cart: AbandonedCart) => {
  selectedCartId.value = cart.id
  showDetailDialog.value = true
  cartsStore.fetchCart(cart.id)
}

const handleScroll = () => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }

  debounceTimeout = setTimeout(() => {
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = document.documentElement.clientHeight

    if (scrollTop + clientHeight >= scrollHeight - 200) {
      cartsStore.loadMore()
    }
  }, 200)
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
  } catch {
    return dateString
  }
}

const formatCurrency = (amount: string, currency: string) => {
  const symbol = currency === 'PEN' ? 'S/' : '$'
  return `${symbol} ${amount}`
}

const getStatusSeverity = (status: number): 'warning' | 'success' | 'info' => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  return 'info'
}

const totalCarts = computed(() => cartsStore.pagination.total)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Carritos Abandonados</h1>
        <p v-if="!cartsStore.isLoading" class="text-gray-600 mt-1">
          {{ totalCarts }} {{ totalCarts === 1 ? 'carrito' : 'carritos' }}
        </p>
      </div>

      <Button
        label="Exportar"
        icon="pi pi-download"
        severity="secondary"
        @click="cartsStore.exportToExcel()"
      />
    </div>

    <!-- Búsqueda -->
    <SearchBar
      v-model="cartsStore.filters.search"
      placeholder="Buscar por correo, nombre, documento o teléfono..."
      @search="handleSearch"
    />

    <!-- Filtros -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-200">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Tipo de cliente</label>
        <Dropdown
          v-model="cartsStore.filters.customer_type"
          :options="customerTypeOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          @change="handleCustomerTypeChange"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Estado Carrito</label>
        <Dropdown
          v-model="cartsStore.filters.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          @change="handleStatusChange"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Canal de recuperación</label>
        <Dropdown
          v-model="cartsStore.filters.channel"
          :options="channelOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          @change="handleChannelChange"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Fecha</label>
        <Calendar
          v-model="dateRange"
          selection-mode="range"
          :manual-input="false"
          date-format="dd/mm/yy"
          show-icon
          class="w-full"
          @date-select="handleDateRangeChange"
        />
      </div>
    </div>

    <div class="flex justify-end">
      <Button
        label="Limpiar filtros"
        icon="pi pi-filter-slash"
        severity="secondary"
        text
        @click="handleClearFilters"
      />
    </div>

    <!-- Tabla de Carritos -->
    <div class="bg-white rounded-lg border border-gray-200">
      <!-- Loading inicial -->
      <div
        v-if="cartsStore.isLoading && !cartsStore.hasCarts"
        class="flex justify-center items-center py-12"
      >
        <ProgressSpinner />
      </div>

      <!-- Error -->
      <div
        v-else-if="cartsStore.error"
        class="bg-red-50 border border-red-200 rounded-lg p-6 text-center m-4"
      >
        <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
        <p class="text-red-700">{{ cartsStore.error }}</p>
        <Button
          label="Reintentar"
          icon="pi pi-refresh"
          class="mt-4"
          @click="cartsStore.fetchCarts()"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!cartsStore.hasCarts"
        class="p-12 text-center"
      >
        <i class="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay carritos abandonados</h3>
        <p class="text-gray-600 mb-4">
          No se encontraron carritos con los filtros seleccionados
        </p>
        <Button label="Limpiar filtros" severity="secondary" @click="handleClearFilters" />
      </div>

      <!-- DataTable -->
      <DataTable
        v-else
        :value="cartsStore.carts"
        striped-rows
        responsive-layout="scroll"
        @row-click="(event) => handleCartClick(event.data)"
      >
        <Column field="id" header="ID" sortable style="width: 80px"></Column>
        <Column field="email" header="Correo" sortable></Column>
        <Column field="customer_name" header="Cliente" sortable></Column>
        <Column field="amount" header="Monto carrito" sortable>
          <template #body="{ data }">
            <span class="font-semibold">{{ formatCurrency(data.amount, data.currency) }}</span>
          </template>
        </Column>
        <Column field="updated_at" header="Fecha" sortable>
          <template #body="{ data }">
            {{ formatDate(data.updated_at) }}
          </template>
        </Column>
        <Column field="status" header="Estado" sortable>
          <template #body="{ data }">
            <Badge :value="data.status_label" :severity="getStatusSeverity(data.status)" />
          </template>
        </Column>
        <Column header="Acciones" style="width: 100px">
          <template #body="{ data }">
            <Button
              icon="pi pi-eye"
              severity="secondary"
              text
              @click.stop="handleCartClick(data)"
            />
          </template>
        </Column>
      </DataTable>

      <!-- Load More -->
      <div v-if="cartsStore.canLoadMore" class="flex justify-center py-4 border-t border-gray-200">
        <Button
          label="Cargar más"
          icon="pi pi-refresh"
          :loading="cartsStore.isLoadingMore"
          @click="cartsStore.loadMore()"
        />
      </div>
    </div>

    <!-- Detail Dialog -->
    <Dialog
      v-model:visible="showDetailDialog"
      modal
      :header="`Carrito #${selectedCartId}`"
      :style="{ width: '50vw' }"
      :breakpoints="{ '960px': '75vw', '641px': '90vw' }"
    >
      <div v-if="cartsStore.isLoading" class="flex justify-center items-center py-8">
        <ProgressSpinner />
      </div>

      <div v-else-if="cartsStore.currentCart" class="space-y-4">
        <!-- Order info if recovered -->
        <div v-if="cartsStore.currentCart.order" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 class="font-semibold text-green-900 mb-2">Carrito recuperado</h5>
          <div class="space-y-1 text-sm">
            <p>
              <span class="font-medium">Código de venta:</span>
              <a
                :href="`/orders/${cartsStore.currentCart.order.id}`"
                class="text-primary hover:underline ml-1"
                target="_blank"
              >
                {{ cartsStore.currentCart.order.reference_code }}
              </a>
            </p>
            <p v-if="cartsStore.currentCart.order.payment_date">
              <span class="font-medium">Fecha de pago:</span>
              {{ formatDate(cartsStore.currentCart.order.payment_date) }}
            </p>
          </div>
        </div>

        <!-- Customer info -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h5 class="font-semibold text-gray-900 mb-3">Datos del carrito</h5>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div v-if="cartsStore.currentCart.customer.business_name">
              <label class="text-gray-600">Razón social</label>
              <p class="font-medium">{{ cartsStore.currentCart.customer.business_name }}</p>
            </div>
            <div v-else class="col-span-2">
              <label class="text-gray-600">Nombre</label>
              <p class="font-medium">
                {{ cartsStore.currentCart.customer.name }}
                {{ cartsStore.currentCart.customer.surname }}
              </p>
            </div>
            <div>
              <label class="text-gray-600">Correo</label>
              <p class="font-medium">{{ cartsStore.currentCart.email }}</p>
            </div>
            <div>
              <label class="text-gray-600">Teléfono</label>
              <p class="font-medium">{{ cartsStore.currentCart.customer.phone || '-' }}</p>
            </div>
            <div>
              <label class="text-gray-600">Fecha de creación</label>
              <p class="font-medium">{{ formatDate(cartsStore.currentCart.created_at) }}</p>
            </div>
            <div>
              <label class="text-gray-600">Última modificación</label>
              <p class="font-medium">{{ formatDate(cartsStore.currentCart.updated_at) }}</p>
            </div>
          </div>
        </div>

        <!-- Products -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h5 class="font-semibold text-gray-900 mb-3">Productos</h5>
          <div class="space-y-2">
            <div
              v-for="item in cartsStore.currentCart.items"
              :key="item.id"
              class="flex gap-4 pb-2 border-b border-gray-100 last:border-0"
            >
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name"
                class="w-16 h-16 object-cover rounded"
              />
              <div class="flex-1">
                <p class="font-medium text-sm">{{ item.name }}</p>
                <p class="text-xs text-gray-600">SKU: {{ item.sku }}</p>
                <p class="text-xs text-gray-600">Cantidad: {{ item.qty }}</p>
              </div>
              <div class="text-right">
                <p class="font-semibold">
                  {{ formatCurrency(item.subtotal, cartsStore.currentCart.currency) }}
                </p>
                <p class="text-xs text-gray-600">
                  {{ formatCurrency(item.price, cartsStore.currentCart.currency) }} c/u
                </p>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between">
            <span class="font-semibold">Total:</span>
            <span class="font-bold text-lg">
              {{ formatCurrency(cartsStore.currentCart.total_amount, cartsStore.currentCart.currency) }}
            </span>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

:deep(.p-datatable-tbody > tr:hover) {
  background-color: #f9fafb !important;
}
</style>
