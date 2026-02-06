<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useReviewsStore } from '@/stores/reviews.store'
import { useFormatters } from '@/composables/useFormatters'
import DataTable, { type DataTableSortEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import StarRating from '@/components/reviews/StarRating.vue'
import type { Review } from '@/types/review.types'

const reviewsStore = useReviewsStore()
const { formatDate } = useFormatters()

const searchQuery = ref('')
let searchTimeout: NodeJS.Timeout | null = null

const deleteDialogVisible = ref(false)
const reviewToDelete = ref<Review | null>(null)

const statusOptions = [
  { label: 'Pendientes', value: 'pending' },
  { label: 'Aprobadas', value: 'approved' },
  { label: 'Rechazadas', value: 'rejected' },
  { label: 'Todas', value: '' },
]

const ratingOptions = [
  { label: 'Todas', value: null },
  { label: '5 estrellas', value: 5 },
  { label: '4 estrellas', value: 4 },
  { label: '3 estrellas', value: 3 },
  { label: '2 estrellas', value: 2 },
  { label: '1 estrella', value: 1 },
]

const selectedStatus = computed({
  get: () => reviewsStore.filters.status,
  set: (value: string) =>
    reviewsStore.setStatusFilter(value as 'pending' | 'approved' | 'rejected' | ''),
})

const selectedRating = computed({
  get: () => reviewsStore.filters.rating,
  set: (value: number | null) => reviewsStore.setRatingFilter(value),
})

onMounted(() => {
  reviewsStore.fetchReviews()
  reviewsStore.fetchStats()
})

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    reviewsStore.setSearch(searchQuery.value)
  }, 300)
}

const handleClearSearch = () => {
  searchQuery.value = ''
  reviewsStore.setSearch('')
}

const onPage = (event: { page: number; rows: number }) => {
  reviewsStore.pagination.page = event.page + 1
  reviewsStore.pagination.limit = event.rows
  reviewsStore.fetchReviews()
}

const onSort = (event: DataTableSortEvent) => {
  const fieldMap: Record<string, string> = {
    product_name: 'product',
    customer_name: 'customer',
    rating: 'rating',
    created_at: 'created_at',
    status: 'status',
  }
  const sortFieldValue = typeof event.sortField === 'string' ? event.sortField : 'created_at'
  const field = fieldMap[sortFieldValue] || 'created_at'
  const order = event.sortOrder === 1 ? 'asc' : 'desc'
  reviewsStore.setSort(field, order)
}

const sortField = computed(() => {
  const reverseMap: Record<string, string> = {
    product: 'product_name',
    customer: 'customer_name',
    rating: 'rating',
    created_at: 'created_at',
    status: 'status',
  }
  return reverseMap[reviewsStore.sorting.field] || 'created_at'
})
const sortOrder = computed(() => (reviewsStore.sorting.order === 'asc' ? 1 : -1))

const handleApprove = async (review: Review) => {
  await reviewsStore.moderate(review.id, 'approved')
}

const handleReject = async (review: Review) => {
  await reviewsStore.moderate(review.id, 'rejected')
}

const handleBulkApprove = async () => {
  await reviewsStore.bulkModerate('approved')
}

const handleBulkReject = async () => {
  await reviewsStore.bulkModerate('rejected')
}

const confirmDelete = (review: Review) => {
  reviewToDelete.value = review
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (reviewToDelete.value) {
    await reviewsStore.deleteReview(reviewToDelete.value.id)
    deleteDialogVisible.value = false
    reviewToDelete.value = null
  }
}

const onSelectionChange = (event: { value: Review[] }) => {
  reviewsStore.selectedIds = event.value.map((r) => r.id)
}

const selectedReviews = computed(() =>
  reviewsStore.reviews.filter((r) => reviewsStore.selectedIds.includes(r.id)),
)

const statusSeverity = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'warning'
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Aprobada'
    case 'rejected':
      return 'Rechazada'
    default:
      return 'Pendiente'
  }
}

const truncate = (text: string | null, len = 80) => {
  if (!text) return '-'
  return text.length > len ? text.substring(0, len) + '...' : text
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold text-secondary">Opiniones</h1>
        <Tag
          v-if="reviewsStore.stats?.pending"
          :value="`${reviewsStore.stats.pending} pendientes`"
          severity="warning"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="reviewsStore.stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <p class="text-sm text-gray-500">Total</p>
        <p class="text-2xl font-bold text-gray-900">{{ reviewsStore.stats.total }}</p>
      </div>
      <div class="bg-white rounded-lg border border-yellow-200 p-4">
        <p class="text-sm text-yellow-600">Pendientes</p>
        <p class="text-2xl font-bold text-yellow-600">{{ reviewsStore.stats.pending }}</p>
      </div>
      <div class="bg-white rounded-lg border border-green-200 p-4">
        <p class="text-sm text-green-600">Aprobadas</p>
        <p class="text-2xl font-bold text-green-600">{{ reviewsStore.stats.approved }}</p>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <p class="text-sm text-gray-500">Rating promedio</p>
        <div class="flex items-center gap-2 mt-1">
          <StarRating :rating="Math.round(reviewsStore.stats.avg_rating)" size="sm" />
          <span class="text-lg font-bold text-gray-900">{{ reviewsStore.stats.avg_rating }}</span>
        </div>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-wrap gap-3 items-center">
      <div class="relative flex-1 max-w-md">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <InputText
          v-model="searchQuery"
          placeholder="Buscar por producto, cliente o comentario..."
          class="w-full pl-10"
          @input="handleSearch"
        />
      </div>
      <Dropdown
        v-model="selectedStatus"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Estado"
        class="w-40"
      />
      <Dropdown
        v-model="selectedRating"
        :options="ratingOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Calificación"
        class="w-40"
      />
      <Button
        v-if="searchQuery"
        icon="pi pi-times"
        text
        severity="secondary"
        @click="handleClearSearch"
      />
    </div>

    <!-- Bulk Actions Bar -->
    <div
      v-if="reviewsStore.hasSelection"
      class="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between"
    >
      <span class="text-sm font-medium text-primary">
        {{ reviewsStore.selectionCount }} opiniones seleccionadas
      </span>
      <div class="flex gap-2">
        <Button
          label="Aprobar"
          icon="pi pi-check"
          size="small"
          severity="success"
          @click="handleBulkApprove"
        />
        <Button
          label="Rechazar"
          icon="pi pi-times"
          size="small"
          severity="danger"
          outlined
          @click="handleBulkReject"
        />
        <Button
          label="Deseleccionar"
          icon="pi pi-minus-circle"
          size="small"
          text
          severity="secondary"
          @click="reviewsStore.clearSelection()"
        />
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="reviewsStore.isLoading && !reviewsStore.hasReviews"
      class="flex justify-center items-center py-20"
    >
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="reviewsStore.error"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
      <p class="text-red-700">{{ reviewsStore.error }}</p>
      <Button
        label="Reintentar"
        icon="pi pi-refresh"
        class="mt-4"
        @click="reviewsStore.fetchReviews()"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!reviewsStore.hasReviews && !reviewsStore.isLoading"
      class="bg-white border border-gray-200 rounded-lg p-12 text-center"
    >
      <i class="pi pi-star text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay opiniones</h3>
      <p class="text-gray-600 mb-4">
        {{
          searchQuery
            ? 'No se encontraron opiniones con esa búsqueda'
            : 'Aún no hay opiniones de clientes'
        }}
      </p>
      <Button
        v-if="searchQuery || reviewsStore.filters.status"
        label="Limpiar filtros"
        icon="pi pi-filter-slash"
        outlined
        @click="handleClearSearch(); reviewsStore.resetFilters()"
      />
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="reviewsStore.reviews"
        :loading="reviewsStore.isLoading"
        :paginator="true"
        :rows="reviewsStore.pagination.limit"
        :totalRecords="reviewsStore.pagination.total"
        :lazy="true"
        :first="(reviewsStore.pagination.page - 1) * reviewsStore.pagination.limit"
        :rowsPerPageOptions="[10, 20, 50]"
        :sortField="sortField"
        :sortOrder="sortOrder"
        :selection="selectedReviews"
        @page="onPage"
        @sort="onSort"
        @selection-change="onSelectionChange"
        :rowHover="true"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        dataKey="id"
      >
        <Column selectionMode="multiple" style="width: 40px" />

        <Column field="product_name" header="Producto" sortable style="min-width: 180px">
          <template #body="{ data }">
            <div>
              <p class="font-semibold text-gray-900">{{ data.product_name || '-' }}</p>
              <p v-if="data.product_sku" class="text-xs text-gray-500">{{ data.product_sku }}</p>
            </div>
          </template>
        </Column>

        <Column field="customer_name" header="Cliente" sortable style="min-width: 150px">
          <template #body="{ data }">
            <p class="text-gray-900">{{ data.customer_name }}</p>
          </template>
        </Column>

        <Column field="rating" header="Calificación" sortable style="width: 140px">
          <template #body="{ data }">
            <StarRating :rating="data.rating" size="sm" />
          </template>
        </Column>

        <Column field="comment" header="Comentario" style="min-width: 200px">
          <template #body="{ data }">
            <p class="text-sm text-gray-600">{{ truncate(data.comment) }}</p>
          </template>
        </Column>

        <Column field="status" header="Estado" sortable style="width: 110px">
          <template #body="{ data }">
            <Tag
              :value="statusLabel(data.status)"
              :severity="statusSeverity(data.status)"
              class="text-xs"
            />
          </template>
        </Column>

        <Column field="created_at" header="Fecha" sortable style="width: 120px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ formatDate(data.created_at) }}</span>
          </template>
        </Column>

        <Column header="Acciones" style="width: 130px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                v-if="data.status !== 'approved'"
                icon="pi pi-check"
                text
                rounded
                severity="success"
                size="small"
                v-tooltip.top="'Aprobar'"
                @click.stop="handleApprove(data)"
              />
              <Button
                v-if="data.status !== 'rejected'"
                icon="pi pi-times"
                text
                rounded
                severity="warning"
                size="small"
                v-tooltip.top="'Rechazar'"
                @click.stop="handleReject(data)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                v-tooltip.top="'Eliminar'"
                @click.stop="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Delete Dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Eliminar opinión"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>
        ¿Estás seguro de que deseas eliminar esta opinión? Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <Button label="Cancelar" text @click="deleteDialogVisible = false" />
        <Button label="Eliminar" severity="danger" icon="pi pi-trash" @click="handleDelete" />
      </template>
    </Dialog>
  </div>
</template>
