<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomersStore } from '@/stores/customers.store'
import SearchBar from '@/components/common/SearchBar.vue'
import CustomerCard from '@/components/customers/CustomerCard.vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import type { Customer } from '@/types/customer.types'

const router = useRouter()
const customersStore = useCustomersStore()

const filterVerified = ref<{ label: string; value: boolean | null } | null>(null)
const filterBlocked = ref<{ label: string; value: boolean | null } | null>(null)

const verifiedOptions = [
  { label: 'Todos', value: null },
  { label: 'Verificados', value: true },
  { label: 'No verificados', value: false }
]

const blockedOptions = [
  { label: 'Todos', value: null },
  { label: 'Activos', value: false },
  { label: 'Bloqueados', value: true }
]

let debounceTimeout: NodeJS.Timeout | null = null

onMounted(() => {
  customersStore.fetchCustomers()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
})

const handleSearch = (query: string) => {
  customersStore.setSearch(query)
}

const handleVerifiedFilterChange = () => {
  customersStore.setVerified(filterVerified.value?.value ?? null)
}

const handleBlockedFilterChange = () => {
  customersStore.setBlocked(filterBlocked.value?.value ?? null)
}

const handleClearFilters = () => {
  filterVerified.value = null
  filterBlocked.value = null
  customersStore.resetFilters()
}

const handleCustomerClick = (customer: Customer) => {
  router.push(`/customers/${customer.id}`)
}

const handleLoadMore = () => {
  customersStore.loadMore()
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
      customersStore.loadMore()
    }
  }, 200)
}

const totalCustomers = computed(() => customersStore.pagination.total)

const hasActiveFilters = computed(() => {
  return (
    customersStore.filters.search ||
    customersStore.filters.verified !== null ||
    customersStore.filters.blocked !== null
  )
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Clientes</h1>
        <p v-if="!customersStore.isLoading" class="text-gray-600 mt-1">
          {{ totalCustomers }} {{ totalCustomers === 1 ? 'cliente' : 'clientes' }}
        </p>
      </div>
    </div>

    <!-- Búsqueda -->
    <SearchBar
      v-model="customersStore.filters.search"
      placeholder="Buscar por nombre, email o documento..."
      @search="handleSearch"
    />

    <!-- Filtros rápidos -->
    <div class="flex flex-wrap gap-3">
      <Dropdown
        v-model="filterVerified"
        :options="verifiedOptions"
        option-label="label"
        placeholder="Estado de verificación"
        class="w-full md:w-auto"
        @change="handleVerifiedFilterChange"
      />

      <Dropdown
        v-model="filterBlocked"
        :options="blockedOptions"
        option-label="label"
        placeholder="Estado de cuenta"
        class="w-full md:w-auto"
        @change="handleBlockedFilterChange"
      />

      <Button
        v-if="hasActiveFilters"
        label="Limpiar filtros"
        icon="pi pi-filter-slash"
        outlined
        @click="handleClearFilters"
      />
    </div>

    <!-- Lista de Clientes -->
    <div>
      <!-- Loading inicial -->
      <div
        v-if="customersStore.isLoading && !customersStore.hasCustomers"
        class="flex justify-center items-center py-12"
      >
        <ProgressSpinner />
      </div>

      <!-- Error -->
      <div
        v-else-if="customersStore.error"
        class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
      >
        <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
        <p class="text-red-700">{{ customersStore.error }}</p>
        <Button
          label="Reintentar"
          icon="pi pi-refresh"
          class="mt-4"
          @click="customersStore.fetchCustomers()"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!customersStore.hasCustomers"
        class="bg-white border border-gray-200 rounded-lg p-12 text-center"
      >
        <i class="pi pi-users text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay clientes</h3>
        <p class="text-gray-600 mb-4">
          No se encontraron clientes con los filtros seleccionados
        </p>
        <Button
          v-if="hasActiveFilters"
          label="Limpiar filtros"
          icon="pi pi-filter-slash"
          @click="handleClearFilters"
        />
      </div>

      <!-- Grid de Clientes -->
      <div v-else class="space-y-4">
        <CustomerCard
          v-for="customer in customersStore.customers"
          :key="customer.id"
          :customer="customer"
          @click="handleCustomerClick"
        />

        <!-- Loading más clientes -->
        <div v-if="customersStore.isLoading" class="flex justify-center py-6">
          <ProgressSpinner style="width: 40px; height: 40px" />
        </div>

        <!-- Botón Cargar Más -->
        <div
          v-if="customersStore.pagination.hasMore && !customersStore.isLoading"
          class="flex justify-center py-6"
        >
          <Button
            label="Cargar más clientes"
            icon="pi pi-chevron-down"
            outlined
            @click="handleLoadMore"
          />
        </div>

        <!-- Fin de resultados -->
        <div
          v-if="!customersStore.pagination.hasMore && customersStore.hasCustomers"
          class="text-center py-6 text-gray-500"
        >
          <i class="pi pi-check-circle mr-2"></i>
          Has visto todos los clientes
        </div>
      </div>
    </div>
  </div>
</template>
