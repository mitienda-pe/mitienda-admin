<template>
  <div class="stores-list-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Administración de Tiendas</h1>
      <p class="text-gray-600">Gestión y acceso a todas las tiendas del sistema</p>
    </div>

    <!-- Filters -->
    <StoreFilters v-model="adminStore.filters" @filter="handleFilter" />

    <!-- Loading State -->
    <div v-if="adminStore.isLoading" class="flex justify-center items-center py-12">
      <i class="pi pi-spin pi-spinner text-4xl text-blue-600"></i>
    </div>

    <!-- Error State -->
    <div
      v-else-if="adminStore.error"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-4"
    >
      <i class="pi pi-exclamation-circle mr-2"></i>
      {{ adminStore.error }}
    </div>

    <!-- Stores List -->
    <div v-else class="mt-6">
      <!-- Stats -->
      <div class="mb-4 text-sm text-gray-600" v-if="adminStore.pagination">
        Mostrando {{ adminStore.stores.length }} de {{ adminStore.pagination.total }} tiendas
      </div>

      <!-- Grid -->
      <div v-if="adminStore.stores.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StoreCard
          v-for="store in adminStore.stores"
          :key="store.id"
          :store="store"
          :loading="impersonatingStoreId === store.id"
          @impersonate="handleImpersonate"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
      >
        <i class="pi pi-inbox text-5xl text-gray-400 mb-4"></i>
        <p class="text-gray-600 text-lg">No se encontraron tiendas</p>
        <p class="text-gray-500 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
      </div>

      <!-- Pagination -->
      <div
        v-if="adminStore.pagination && adminStore.pagination.total_pages > 1"
        class="flex justify-center items-center gap-2 mt-6"
      >
        <button
          @click="changePage(adminStore.pagination.page - 1)"
          :disabled="adminStore.pagination.page === 1"
          class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="pi pi-chevron-left"></i>
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :class="[
              'px-3 py-2 border rounded-md',
              page === adminStore.pagination.page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="changePage(adminStore.pagination.page + 1)"
          :disabled="adminStore.pagination.page === adminStore.pagination.total_pages"
          class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin.store'
import { useAuthStore } from '@/stores/auth.store'
import StoreFilters from '@/components/admin/StoreFilters.vue'
import StoreCard from '@/components/admin/StoreCard.vue'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()
const impersonatingStoreId = ref<number | null>(null)

onMounted(async () => {
  // Verificar permisos
  if (!authStore.isSuperAdmin) {
    router.push('/dashboard')
    return
  }

  // Cargar tiendas
  await adminStore.fetchStores()
})

async function handleFilter() {
  await adminStore.fetchStores()
}

async function handleImpersonate(storeId: number) {
  impersonatingStoreId.value = storeId

  const success = await adminStore.impersonate(storeId)

  if (success) {
    // Redirigir al dashboard de la tienda impersonada
    router.push('/dashboard')
  } else {
    impersonatingStoreId.value = null
  }
}

function changePage(page: number) {
  adminStore.setPage(page)
}

const visiblePages = computed(() => {
  if (!adminStore.pagination) return []

  const current = adminStore.pagination.page
  const total = adminStore.pagination.total_pages
  const delta = 2 // Páginas a mostrar antes y después de la actual

  const pages: number[] = []

  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    pages.push(i)
  }

  return pages
})
</script>

<style scoped>
.stores-list-view {
  padding: 1.5rem;
}
</style>
