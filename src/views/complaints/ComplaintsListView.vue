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
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { complaintsApi } from '@/api/complaints.api'

const router = useRouter()
const complaintsStore = useComplaintsStore()
const { formatDate } = useFormatters()
const toast = useToast()

// Libro de Reclamaciones propio: la tienda indica la URL del suyo y el
// storefront manda ahí el enlace del pie. null = el de MiTienda.
const externalUrl = ref<string | null>(null)
const showSettingsDialog = ref(false)
const isSavingSettings = ref(false)
const settingsMode = ref<'mitienda' | 'external'>('mitienda')
const settingsUrl = ref('')
const settingsError = ref('')

const loadSettings = async () => {
  try {
    const response = await complaintsApi.getSettings()
    externalUrl.value = response.data?.external_url ?? null
  } catch {
    // Sin la configuración la página funciona igual: solo falta el aviso.
  }
}

const openSettingsDialog = () => {
  settingsMode.value = externalUrl.value ? 'external' : 'mitienda'
  settingsUrl.value = externalUrl.value ?? ''
  settingsError.value = ''
  showSettingsDialog.value = true
}

const saveSettings = async () => {
  settingsError.value = ''
  const url = settingsMode.value === 'external' ? settingsUrl.value.trim() : ''
  if (settingsMode.value === 'external' && !url.startsWith('https://')) {
    settingsError.value = 'Ingresa la URL completa de tu libro, empezando con https://'
    return
  }

  try {
    isSavingSettings.value = true
    const response = await complaintsApi.updateSettings({ external_url: url || null })
    externalUrl.value = response.data?.external_url ?? null
    toast.add({ severity: 'success', summary: 'Guardado', detail: response.message || 'Configuración guardada', life: 3000 })
    showSettingsDialog.value = false
  } catch (error: any) {
    settingsError.value = error.response?.data?.messages?.error
      || error.response?.data?.message
      || 'No se pudo guardar la configuración'
  } finally {
    isSavingSettings.value = false
  }
}

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
  { label: 'Petición', value: '3' },
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
  loadSettings()
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
        <h1 class="text-3xl font-bold text-secondary">
          Libro de Reclamaciones
        </h1>
        <Tag
          v-if="complaintsStore.stats?.pending"
          :value="`${complaintsStore.stats.pending} pendientes`"
          severity="warning"
        />
      </div>
      <Button
        label="Configuración"
        icon="pi pi-cog"
        severity="secondary"
        outlined
        @click="openSettingsDialog"
      />
    </div>

    <!-- Libro propio -->
    <div
      v-if="externalUrl"
      class="bg-primary/5 border border-primary/30 rounded-lg p-4 flex gap-3"
    >
      <i class="pi pi-external-link text-primary mt-0.5" />
      <div class="text-sm text-secondary">
        <p class="font-semibold">
          Tu tienda usa su propio Libro de Reclamaciones
        </p>
        <p class="mt-1">
          El enlace de tu tienda lleva a
          <a
            :href="externalUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary underline break-all"
          >{{ externalUrl }}</a>.
          Los reclamos nuevos llegan allí y no aparecen en esta lista; aquí quedan los que recibiste antes.
        </p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div
      v-if="complaintsStore.stats"
      class="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <p class="text-sm text-gray-500">
          Total
        </p>
        <p class="text-2xl font-bold text-gray-900">
          {{ complaintsStore.stats.total }}
        </p>
      </div>
      <div class="bg-white rounded-lg border border-yellow-200 p-4">
        <p class="text-sm text-yellow-600">
          Pendientes
        </p>
        <p class="text-2xl font-bold text-yellow-600">
          {{ complaintsStore.stats.pending }}
        </p>
      </div>
      <div class="bg-white rounded-lg border border-green-200 p-4">
        <p class="text-sm text-green-600">
          Atendidos
        </p>
        <p class="text-2xl font-bold text-green-600">
          {{ complaintsStore.stats.attended }}
        </p>
      </div>
      <div class="bg-white rounded-lg border border-primary/20 p-4">
        <p class="text-sm text-primary">
          No vistos
        </p>
        <p class="text-2xl font-bold text-primary">
          {{ complaintsStore.stats.unseen }}
        </p>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-wrap gap-3 items-center">
      <div class="relative flex-1 max-w-md">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <InputText
          v-model="searchQuery"
          placeholder="Buscar por nombre, código, email o documento..."
          class="w-full !pl-10"
          @input="handleSearch"
        />
      </div>
      <Dropdown
        v-model="selectedStatus"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="Estado"
        class="w-36"
      />
      <Dropdown
        v-model="selectedType"
        :options="typeOptions"
        option-label="label"
        option-value="value"
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
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2" />
      <p class="text-red-700">
        {{ complaintsStore.error }}
      </p>
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
      <i class="pi pi-book text-6xl text-gray-300 mb-4" />
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        No hay reclamaciones
      </h3>
      <p class="text-gray-600">
        {{
          searchQuery
            ? 'No se encontraron reclamaciones con esa búsqueda'
            : 'No tienes reclamaciones registradas'
        }}
      </p>
    </div>

    <!-- Table -->
    <div
      v-else
      class="bg-white rounded-lg shadow overflow-hidden"
    >
      <DataTable
        :value="complaintsStore.complaints"
        :loading="complaintsStore.isLoading"
        :paginator="true"
        :rows="complaintsStore.pagination.limit"
        :total-records="complaintsStore.pagination.total"
        :lazy="true"
        :first="(complaintsStore.pagination.page - 1) * complaintsStore.pagination.limit"
        :rows-per-page-options="[10, 20, 50]"
        :sort-field="sortField"
        :sort-order="sortOrder"
        selection-mode="single"
        :row-hover="true"
        class="cursor-pointer"
        responsive-layout="scroll"
        striped-rows
        removable-sort
        data-key="id"
        @page="onPage"
        @sort="onSort"
        @row-click="(e: any) => goToDetail(e.data.id)"
      >
        <Column
          field="code"
          header="Código"
          sortable
          style="width: 130px"
        >
          <template #body="{ data }">
            <div>
              <span class="font-mono font-semibold text-primary">{{ data.code }}</span>
              <span
                v-if="!data.seen"
                v-tooltip.top="'No visto'"
                class="ml-2 inline-block w-2 h-2 bg-primary rounded-full"
              />
            </div>
          </template>
        </Column>

        <Column
          field="name"
          header="Nombre"
          sortable
          style="min-width: 160px"
        >
          <template #body="{ data }">
            <p class="font-semibold text-gray-900">
              {{ data.name }}
            </p>
          </template>
        </Column>

        <Column
          header="Documento"
          style="width: 160px"
        >
          <template #body="{ data }">
            <div class="text-sm">
              <span class="text-gray-500">{{ data.document_type }}: </span>
              <span class="font-mono">{{ data.document_number }}</span>
            </div>
          </template>
        </Column>

        <Column
          header="Email"
          style="min-width: 160px"
        >
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ data.email }}</span>
          </template>
        </Column>

        <Column
          field="complaint_type"
          header="Tipo"
          sortable
          style="width: 100px"
        >
          <template #body="{ data }">
            <Tag
              :value="data.complaint_type"
              :severity="data.complaint_type_id === 1 ? 'warning' : 'info'"
              class="text-xs"
            />
          </template>
        </Column>

        <Column
          header="Estado"
          style="width: 110px"
        >
          <template #body="{ data }">
            <Tag
              :value="data.status === 'attended' ? 'Atendido' : 'Pendiente'"
              :severity="data.status === 'attended' ? 'success' : 'warning'"
              class="text-xs"
            />
          </template>
        </Column>

        <Column
          field="date"
          header="Fecha"
          sortable
          style="width: 120px"
        >
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ formatDate(data.date) }}</span>
          </template>
        </Column>

        <Column style="width: 60px">
          <template #body>
            <i class="pi pi-chevron-right text-gray-400" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog Configuración -->
    <Dialog
      v-model:visible="showSettingsDialog"
      header="Libro de Reclamaciones de tu tienda"
      :modal="true"
      :style="{ width: '560px' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <p class="text-sm text-secondary-500 mb-4">
        Elige a dónde lleva el enlace del Libro de Reclamaciones de tu tienda.
      </p>
      <div class="space-y-3">
        <button
          type="button"
          class="w-full text-left rounded-lg border-2 p-3 transition-colors"
          :class="settingsMode === 'mitienda' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'"
          :aria-pressed="settingsMode === 'mitienda'"
          @click="settingsMode = 'mitienda'"
        >
          <p class="font-semibold text-secondary">
            Usar el de MiTienda
          </p>
          <p class="text-sm text-secondary-500">
            Tus clientes registran el reclamo en tu tienda, te avisamos por correo y lo respondes desde aquí.
          </p>
        </button>
        <button
          type="button"
          class="w-full text-left rounded-lg border-2 p-3 transition-colors"
          :class="settingsMode === 'external' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'"
          :aria-pressed="settingsMode === 'external'"
          @click="settingsMode = 'external'"
        >
          <p class="font-semibold text-secondary">
            Usar mi propio libro
          </p>
          <p class="text-sm text-secondary-500">
            El enlace lleva a tu libro en otra web. Los reclamos llegan allí y no a este panel.
          </p>
        </button>
      </div>

      <div
        v-if="settingsMode === 'external'"
        class="mt-4 space-y-2"
      >
        <label
          for="complaints-external-url"
          class="block text-sm font-medium text-secondary"
        >
          URL de tu Libro de Reclamaciones
        </label>
        <InputText
          id="complaints-external-url"
          v-model="settingsUrl"
          type="url"
          placeholder="https://www.tuempresa.com/libro-de-reclamaciones"
          class="w-full"
          :invalid="!!settingsError"
        />
        <p class="text-xs text-secondary-500">
          Responder cada reclamo dentro del plazo legal (15 días hábiles) queda a cargo de tu empresa.
        </p>
      </div>

      <p
        v-if="settingsError"
        class="mt-3 text-sm text-red-600"
      >
        {{ settingsError }}
      </p>

      <template #footer>
        <Button
          label="Cancelar"
          text
          @click="showSettingsDialog = false"
        />
        <Button
          label="Guardar"
          :loading="isSavingSettings"
          @click="saveSettings"
        />
      </template>
    </Dialog>
  </div>
</template>
