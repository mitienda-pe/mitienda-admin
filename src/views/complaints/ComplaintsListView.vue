<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useComplaintsStore } from '@/stores/complaints.store'
import { useFormatters } from '@/composables/useFormatters'
import DataTable, { type DataTableSortEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const complaintsStore = useComplaintsStore()
const { formatDate } = useFormatters()

const searchQuery = ref('')
let searchTimeout: NodeJS.Timeout | null = null

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Atendidos', value: 'attended' },
]

const typeOptions = [
  { label: 'Todos', value: '' },
  { label: 'Reclamo', value: '1' },
  { label: 'Queja', value: '2' },
]

const selectedStatus = computed({
  get: () => complaintsStore.filters.status,
  set: (value: string) =>
    complaintsStore.setStatusFilter(value as 'pending' | 'attended' | ''),
})

const selectedType = computed({
  get: () => complaintsStore.filters.type,
  set: (value: string) => complaintsStore.setTypeFilter(value as '' | '1' | '2'),
})

onMounted(() => {
  complaintsStore.fetchComplaints()
  complaintsStore.fetchStats()
})

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    complaintsStore.setSearch(searchQuery.value)
  }, 300)
}

const handleClearSearch = () => {
  searchQuery.value = ''
  complaintsStore.setSearch('')
}

const onPage = (event: { page: number; rows: number }) => {
  complaintsStore.pagination.page = event.page + 1
  complaintsStore.pagination.limit = event.rows
  complaintsStore.fetchComplaints()
}

const onSort = (event: DataTableSortEvent) => {
  const fieldMap: Record<string, string> = {
    code: 'code',
    name: 'name',
    complaint_type: 'type',
    date: 'date',
  }
  const sortFieldValue = typeof event.sortField === 'string' ? event.sortField : 'date'
  const field = fieldMap[sortFieldValue] || 'date'
  const order = event.sortOrder === 1 ? 'asc' : 'desc'
  complaintsStore.setSort(field, order)
}

const sortField = computed(() => {
  const reverseMap: Record<string, string> = {
    code: 'code',
    name: 'name',
    type: 'complaint_type',
    date: 'date',
  }
  return reverseMap[complaintsStore.sorting.field] || 'date'
})
const sortOrder = computed(() => (complaintsStore.sorting.order === 'asc' ? 1 : -1))

const goToDetail = (id: number) => {
  router.push(`/complaints/${id}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold text-secondary">Libro de Reclamaciones</h1>
        <Tag
          v-if="complaintsStore.stats?.pending"
          :value="`${complaintsStore.stats.pending} pendientes`"
          severity="warning"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="complaintsStore.stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <p class="text-sm text-gray-500">Total</p>
        <p class="text-2xl font-bold text-gray-900">{{ complaintsStore.stats.total }}</p>
      </div>
      <div class="bg-white rounded-lg border border-yellow-200 p-4">
        <p class="text-sm text-yellow-600">Pendientes</p>
        <p class="text-2xl font-bold text-yellow-600">{{ complaintsStore.stats.pending }}</p>
      </div>
      <div class="bg-white rounded-lg border border-green-200 p-4">
        <p class="text-sm text-green-600">Atendidos</p>
        <p class="text-2xl font-bold text-green-600">{{ complaintsStore.stats.attended }}</p>
      </div>
      <div class="bg-white rounded-lg border border-blue-200 p-4">
        <p class="text-sm text-blue-600">No vistos</p>
        <p class="text-2xl font-bold text-blue-600">{{ complaintsStore.stats.unseen }}</p>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-wrap gap-3 items-center">
      <div class="relative flex-1 max-w-md">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <InputText
          v-model="searchQuery"
          placeholder="Buscar por nombre, código, email o documento..."
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
        class="w-36"
      />
      <Dropdown
        v-model="selectedType"
        :options="typeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Tipo"
        class="w-36"
      />
      <Button
        v-if="searchQuery"
        icon="pi pi-times"
        text
        severity="secondary"
        @click="handleClearSearch"
      />
    </div>

    <!-- Loading -->
    <div
      v-if="complaintsStore.isLoading && !complaintsStore.hasComplaints"
      class="flex justify-center items-center py-20"
    >
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="complaintsStore.error"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
      <p class="text-red-700">{{ complaintsStore.error }}</p>
      <Button
        label="Reintentar"
        icon="pi pi-refresh"
        class="mt-4"
        @click="complaintsStore.fetchComplaints()"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!complaintsStore.hasComplaints && !complaintsStore.isLoading"
      class="bg-white border border-gray-200 rounded-lg p-12 text-center"
    >
      <i class="pi pi-book text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay reclamaciones</h3>
      <p class="text-gray-600">
        {{
          searchQuery
            ? 'No se encontraron reclamaciones con esa búsqueda'
            : 'No tienes reclamaciones registradas'
        }}
      </p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="complaintsStore.complaints"
        :loading="complaintsStore.isLoading"
        :paginator="true"
        :rows="complaintsStore.pagination.limit"
        :totalRecords="complaintsStore.pagination.total"
        :lazy="true"
        :first="(complaintsStore.pagination.page - 1) * complaintsStore.pagination.limit"
        :rowsPerPageOptions="[10, 20, 50]"
        :sortField="sortField"
        :sortOrder="sortOrder"
        @page="onPage"
        @sort="onSort"
        @row-click="(e: any) => goToDetail(e.data.id)"
        selectionMode="single"
        :rowHover="true"
        class="cursor-pointer"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        dataKey="id"
      >
        <Column field="code" header="Código" sortable style="width: 130px">
          <template #body="{ data }">
            <div>
              <span class="font-mono font-semibold text-primary">{{ data.code }}</span>
              <span
                v-if="!data.seen"
                class="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"
                v-tooltip.top="'No visto'"
              />
            </div>
          </template>
        </Column>

        <Column field="name" header="Nombre" sortable style="min-width: 160px">
          <template #body="{ data }">
            <p class="font-semibold text-gray-900">{{ data.name }}</p>
          </template>
        </Column>

        <Column header="Documento" style="width: 160px">
          <template #body="{ data }">
            <div class="text-sm">
              <span class="text-gray-500">{{ data.document_type }}: </span>
              <span class="font-mono">{{ data.document_number }}</span>
            </div>
          </template>
        </Column>

        <Column header="Email" style="min-width: 160px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ data.email }}</span>
          </template>
        </Column>

        <Column field="complaint_type" header="Tipo" sortable style="width: 100px">
          <template #body="{ data }">
            <Tag
              :value="data.complaint_type"
              :severity="data.complaint_type_id === 1 ? 'warning' : 'info'"
              class="text-xs"
            />
          </template>
        </Column>

        <Column header="Estado" style="width: 110px">
          <template #body="{ data }">
            <Tag
              :value="data.status === 'attended' ? 'Atendido' : 'Pendiente'"
              :severity="data.status === 'attended' ? 'success' : 'warning'"
              class="text-xs"
            />
          </template>
        </Column>

        <Column field="date" header="Fecha" sortable style="width: 120px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ formatDate(data.date) }}</span>
          </template>
        </Column>

        <Column style="width: 60px">
          <template #body>
            <i class="pi pi-chevron-right text-gray-400"></i>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
