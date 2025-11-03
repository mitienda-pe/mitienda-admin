<template>
  <div class="promotions-list-view">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Promociones</h1>
        <p class="mt-1 text-sm text-gray-500">Gestiona las promociones y descuentos de tu tienda</p>
      </div>
      <button
        @click="showCreateDialog = true"
        class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nueva Promoción
      </button>
    </div>

    <!-- Filters -->
    <div class="mb-6 rounded-lg bg-white p-4 shadow">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <label for="search" class="block text-sm font-medium text-gray-700">Buscar</label>
          <input
            id="search"
            v-model="searchQuery"
            type="text"
            placeholder="Nombre o código de promoción..."
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            @input="debouncedSearch"
          />
        </div>

        <!-- Promotion Type Filter -->
        <div>
          <label for="promotion-type" class="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            id="promotion-type"
            v-model="typeFilter"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            @change="applyFilters"
          >
            <option :value="undefined">Todos los tipos</option>
            <option v-for="type in promotionTypes" :key="type.promocion_id" :value="type.promocion_id">
              {{ type.promocion_nombre }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700">Estado</label>
          <select
            id="status"
            v-model="statusFilter"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            @change="applyFilters"
          >
            <option :value="undefined">Todos</option>
            <option :value="1">Activos</option>
            <option :value="0">Inactivos</option>
          </select>
        </div>
      </div>

      <!-- Active Only Checkbox -->
      <div class="mt-4">
        <label class="flex items-center">
          <input
            v-model="activeOnlyFilter"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            @change="applyFilters"
          />
          <span class="ml-2 text-sm text-gray-700">Mostrar solo promociones vigentes (dentro del período de validez)</span>
        </label>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !hasPromotions" class="flex h-64 items-center justify-center">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p class="mt-2 text-sm text-gray-500">Cargando promociones...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error al cargar promociones</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasPromotions && !isLoading" class="text-center">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay promociones</h3>
      <p class="mt-1 text-sm text-gray-500">Comienza creando tu primera promoción.</p>
      <div class="mt-6">
        <button
          @click="showCreateDialog = true"
          type="button"
          class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva Promoción
        </button>
      </div>
    </div>

    <!-- Promotions Table -->
    <div v-else class="overflow-hidden rounded-lg bg-white shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Nombre
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tipo
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Código
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Productos
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Vigencia
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Estado
            </th>
            <th scope="col" class="relative px-6 py-3">
              <span class="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-for="promotion in promotions" :key="promotion.tiendapromocion_id" class="hover:bg-gray-50">
            <td class="whitespace-nowrap px-6 py-4">
              <div class="text-sm font-medium text-gray-900">{{ promotion.tiendapromocion_nombre }}</div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <div class="text-sm text-gray-900">{{ promotion.promocion_nombre }}</div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <div class="text-sm text-gray-500">{{ promotion.tiendapromocion_codigo || '-' }}</div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <div class="text-sm text-gray-900">
                {{ promotion.num_productos || 0 }}
                <span v-if="promotion.promocion_id === 7 && promotion.num_productos_bonificacion" class="text-gray-500">
                  ({{ promotion.num_productos_bonificacion }} bonif.)
                </span>
              </div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <div class="text-sm text-gray-500">
                <div>{{ formatDate(promotion.tiendapromocion_fechainicio) }}</div>
                <div>{{ formatDate(promotion.tiendapromocion_fechacaducidad) }}</div>
                <div v-if="promotion.is_active_period === 1" class="mt-1 text-xs text-green-600">
                  Vigente ({{ promotion.days_until_expiry }} días restantes)
                </div>
                <div v-else class="mt-1 text-xs text-red-600">Fuera de período</div>
              </div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <span
                v-if="promotion.tiendapromocion_estado === 1"
                class="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800"
              >
                Activo
              </span>
              <span
                v-else
                class="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800"
              >
                Inactivo
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <router-link
                :to="`/marketing/promotions/${promotion.tiendapromocion_id}`"
                class="text-indigo-600 hover:text-indigo-900"
              >
                Ver detalles
              </router-link>
              <button
                @click="confirmDelete(promotion)"
                class="ml-4 text-red-600 hover:text-red-900"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div class="flex flex-1 justify-between sm:hidden">
          <button
            @click="previousPage"
            :disabled="pagination.page === 1"
            class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            @click="nextPage"
            :disabled="pagination.page >= pagination.pages"
            class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Mostrando
              <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
              a
              <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
              de
              <span class="font-medium">{{ pagination.total }}</span>
              resultados
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                @click="previousPage"
                :disabled="pagination.page === 1"
                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span class="sr-only">Anterior</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
              <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                Página {{ pagination.page }} de {{ pagination.pages }}
              </span>
              <button
                @click="nextPage"
                :disabled="pagination.page >= pagination.pages"
                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span class="sr-only">Siguiente</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <CreatePromotionDialog
      v-model:visible="showCreateDialog"
      @created="handlePromotionCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePromotionsStore } from '@/stores/promotions.store'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import CreatePromotionDialog from '@/components/promotions/CreatePromotionDialog.vue'

const router = useRouter()

const promotionsStore = usePromotionsStore()
const { promotions, promotionTypes, isLoading, error, pagination, hasPromotions } = storeToRefs(promotionsStore)

// Filters
const searchQuery = ref('')
const typeFilter = ref<number | undefined>(undefined)
const statusFilter = ref<number | undefined>(undefined)
const activeOnlyFilter = ref(false)

// Dialogs
const showCreateDialog = ref(false)

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

// Apply filters
function applyFilters() {
  promotionsStore.updateFilters({
    search: searchQuery.value,
    promocion_id: typeFilter.value,
    estado: statusFilter.value,
    active_only: activeOnlyFilter.value,
  })
  promotionsStore.fetchPromotions()
}

// Pagination
function nextPage() {
  promotionsStore.nextPage()
}

function previousPage() {
  promotionsStore.previousPage()
}

// Delete confirmation
function confirmDelete(promotion: any) {
  if (confirm(`¿Estás seguro de que deseas eliminar la promoción "${promotion.tiendapromocion_nombre}"?`)) {
    deletePromotion(promotion.tiendapromocion_id)
  }
}

async function deletePromotion(id: number) {
  try {
    await promotionsStore.removePromotion(id)
  } catch (error) {
    console.error('Error deleting promotion:', error)
  }
}

// Format date
function formatDate(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Handle promotion created
function handlePromotionCreated(promotion: any) {
  if (promotion && promotion.promocion_id === 7) {
    // Redirigir a la página de configuración completa de bonificaciones
    router.push(`/marketing/promotions/${promotion.tiendapromocion_id}/configure`)
  } else {
    // Refresh the list
    promotionsStore.fetchPromotions()
  }
}

// Initialize
onMounted(async () => {
  await promotionsStore.fetchPromotionTypes()
  await promotionsStore.fetchPromotions()
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
