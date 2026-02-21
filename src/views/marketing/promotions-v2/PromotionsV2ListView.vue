<template>
  <div class="promotions-v2-list-view">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Promociones v2</h1>
        <p class="mt-1 text-sm text-gray-500">
          Motor de reglas: activaciones, condiciones, efectos y restricciones
        </p>
      </div>
      <router-link
        to="/marketing/promotions-v2/new"
        class="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
      >
        <i class="pi pi-plus mr-2"></i>
        Nueva Promoción
      </router-link>
    </div>

    <!-- Filters -->
    <div class="mb-6 rounded-lg bg-white p-4 shadow">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="md:col-span-1">
          <label class="block text-sm font-medium text-secondary-700">Buscar</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Nombre de la promoción..."
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            @input="debouncedSearch"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700">Estado</label>
          <select
            v-model="statusFilter"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            @change="applyFilters"
          >
            <option :value="undefined">Todos</option>
            <option value="draft">Borrador</option>
            <option value="scheduled">Programada</option>
            <option value="active">Activa</option>
            <option value="paused">Pausada</option>
            <option value="expired">Expirada</option>
          </select>
        </div>

        <div class="flex items-end">
          <label class="flex items-center">
            <input
              v-model="activeOnlyFilter"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              @change="applyFilters"
            />
            <span class="ml-2 text-sm text-gray-700">Solo vigentes</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error"
      class="rounded-lg bg-red-50 p-6 text-center"
    >
      <i class="pi pi-exclamation-triangle mb-2 text-3xl text-red-400"></i>
      <p class="text-sm text-red-600">{{ store.error }}</p>
      <button
        class="mt-3 text-sm font-medium text-primary hover:underline"
        @click="loadPromotions"
      >
        Reintentar
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!store.hasPromotions"
      class="rounded-lg bg-white p-12 text-center shadow"
    >
      <i class="pi pi-percentage mb-4 text-5xl text-gray-300"></i>
      <h3 class="text-lg font-medium text-gray-900">Sin promociones</h3>
      <p class="mt-1 text-sm text-gray-500">Crea tu primera promoción con el motor de reglas</p>
      <router-link
        to="/marketing/promotions-v2/new"
        class="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
      >
        <i class="pi pi-plus mr-2"></i>
        Nueva Promoción
      </router-link>
    </div>

    <!-- Table -->
    <div v-else class="rounded-lg bg-white shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Nombre
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Estado
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Prioridad
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Reglas
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Vigencia
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr
            v-for="promo in store.promotions"
            :key="promo.promotions_v2_id"
            class="hover:bg-gray-50 cursor-pointer"
            @click="goToDetail(promo.promotions_v2_id)"
          >
            <td class="whitespace-nowrap px-6 py-4">
              <div class="font-medium text-gray-900">{{ promo.name }}</div>
              <div v-if="promo.description" class="text-sm text-gray-500 truncate max-w-xs">
                {{ promo.description }}
              </div>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <span
                class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                :class="statusClasses(promo.status)"
              >
                {{ statusLabel(promo.status) }}
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              {{ promo.priority }}
              <span v-if="promo.stackable" class="ml-1 text-xs text-primary">(acumulable)</span>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              <div class="flex gap-2">
                <span v-if="promo.activations_count" class="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
                  {{ promo.activations_count }} act.
                </span>
                <span v-if="promo.conditions_count" class="text-xs bg-yellow-100 text-yellow-700 rounded px-1.5 py-0.5">
                  {{ promo.conditions_count }} cond.
                </span>
                <span v-if="promo.effects_count" class="text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5">
                  {{ promo.effects_count }} efec.
                </span>
                <span v-if="promo.constraints_count" class="text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5">
                  {{ promo.constraints_count }} rest.
                </span>
              </div>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
              <div>{{ formatDate(promo.starts_at) }}</div>
              <div v-if="promo.ends_at" class="text-xs text-gray-400">
                hasta {{ formatDate(promo.ends_at) }}
              </div>
              <div v-else class="text-xs text-gray-400">Sin fecha fin</div>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-right text-sm" @click.stop>
              <button
                class="text-red-600 hover:text-red-800"
                title="Eliminar"
                @click="confirmDelete(promo)"
              >
                <i class="pi pi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
        <div class="text-sm text-gray-700">
          Mostrando página {{ store.pagination.page }} de {{ store.pagination.pages }}
          ({{ store.pagination.total }} total)
        </div>
        <div class="flex gap-2">
          <button
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            :disabled="store.pagination.page <= 1"
            @click="store.previousPage()"
          >
            Anterior
          </button>
          <button
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            :disabled="store.pagination.page >= store.pagination.pages"
            @click="store.nextPage()"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      :modal="true"
      header="Confirmar eliminación"
      :style="{ width: '400px' }"
    >
      <p class="text-sm text-gray-600">
        ¿Estás seguro de que deseas eliminar la promoción
        <strong>{{ promotionToDelete?.name }}</strong>?
        Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <button
          class="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="showDeleteDialog = false"
        >
          Cancelar
        </button>
        <button
          class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          @click="handleDelete"
        >
          Eliminar
        </button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import { usePromotionV2Store } from '@/stores/promotion-v2.store'
import { useFormatters } from '@/composables/useFormatters'
import { STATUS_LABELS } from '@/types/promotion-v2.types'
import type { PromotionV2, PromotionV2Status } from '@/types/promotion-v2.types'

const router = useRouter()
const store = usePromotionV2Store()
const { formatDate } = useFormatters()

const searchQuery = ref('')
const statusFilter = ref<PromotionV2Status | undefined>(undefined)
const activeOnlyFilter = ref(false)
const showDeleteDialog = ref(false)
const promotionToDelete = ref<PromotionV2 | null>(null)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 400)
}

function applyFilters() {
  store.updateFilters({
    search: searchQuery.value || undefined,
    status: statusFilter.value,
    active_only: activeOnlyFilter.value,
  })
  store.fetchPromotions({ page: 1 })
}

function statusLabel(status: PromotionV2Status) {
  return STATUS_LABELS[status] || status
}

function statusClasses(status: PromotionV2Status) {
  const map: Record<PromotionV2Status, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

function goToDetail(id: number) {
  router.push(`/marketing/promotions-v2/${id}`)
}

function confirmDelete(promo: PromotionV2) {
  promotionToDelete.value = promo
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!promotionToDelete.value) return
  try {
    await store.removePromotion(promotionToDelete.value.promotions_v2_id)
    showDeleteDialog.value = false
    promotionToDelete.value = null
  } catch {
    // error is set in store
  }
}

async function loadPromotions() {
  await store.fetchPromotions()
}

onMounted(() => {
  loadPromotions()
})
</script>
