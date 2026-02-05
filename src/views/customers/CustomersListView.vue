<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomersStore } from '@/stores/customers.store'
import { useFormatters } from '@/composables/useFormatters'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import type { Customer } from '@/types/customer.types'

const router = useRouter()
const customersStore = useCustomersStore()
const { formatCurrency, formatDate } = useFormatters()

const searchQuery = ref('')
let searchTimeout: NodeJS.Timeout | null = null

onMounted(() => {
  customersStore.fetchCustomers()
})

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    customersStore.setSearch(searchQuery.value)
  }, 300)
}

const handleClearSearch = () => {
  searchQuery.value = ''
  customersStore.setSearch('')
}

const handleRowClick = (event: { data: Customer }) => {
  router.push(`/customers/${event.data.id}`)
}

const onPage = (event: { page: number; rows: number }) => {
  customersStore.pagination.page = event.page + 1
  customersStore.pagination.limit = event.rows
  customersStore.fetchCustomers()
}

const totalCustomers = computed(() => customersStore.pagination.total)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Clientes</h1>
        <p v-if="!customersStore.isLoading" class="text-sm text-secondary-500 mt-1">
          {{ totalCustomers }} {{ totalCustomers === 1 ? 'cliente registrado' : 'clientes registrados' }}
        </p>
      </div>
    </div>

    <!-- Búsqueda -->
    <div class="flex gap-3">
      <div class="relative flex-1 max-w-md">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <InputText
          v-model="searchQuery"
          placeholder="Buscar por nombre, email o documento..."
          class="w-full pl-10"
          @input="handleSearch"
        />
      </div>
      <Button
        v-if="searchQuery"
        icon="pi pi-times"
        text
        severity="secondary"
        @click="handleClearSearch"
      />
    </div>

    <!-- Loading inicial -->
    <div
      v-if="customersStore.isLoading && !customersStore.hasCustomers"
      class="flex justify-center items-center py-20"
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
      v-else-if="!customersStore.hasCustomers && !customersStore.isLoading"
      class="bg-white border border-gray-200 rounded-lg p-12 text-center"
    >
      <i class="pi pi-users text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay clientes</h3>
      <p class="text-gray-600 mb-4">
        {{ searchQuery ? 'No se encontraron clientes con esa búsqueda' : 'Aún no tienes clientes registrados' }}
      </p>
      <Button
        v-if="searchQuery"
        label="Limpiar búsqueda"
        icon="pi pi-times"
        outlined
        @click="handleClearSearch"
      />
    </div>

    <!-- Tabla de Clientes -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="customersStore.customers"
        :loading="customersStore.isLoading"
        :paginator="true"
        :rows="customersStore.pagination.limit"
        :totalRecords="customersStore.pagination.total"
        :lazy="true"
        :first="(customersStore.pagination.page - 1) * customersStore.pagination.limit"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPage"
        @row-click="handleRowClick"
        selectionMode="single"
        :rowHover="true"
        class="cursor-pointer"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="name" header="Cliente" sortable style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {{ data.name.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 truncate">{{ data.name }}</p>
                <p class="text-sm text-gray-500 truncate">{{ data.email || '-' }}</p>
              </div>
            </div>
          </template>
        </Column>

        <Column field="document_number" header="Documento" style="width: 140px">
          <template #body="{ data }">
            <span class="font-mono text-sm">{{ data.document_number || '-' }}</span>
          </template>
        </Column>

        <Column field="phone" header="Teléfono" style="width: 130px">
          <template #body="{ data }">
            <span class="text-sm">{{ data.phone || '-' }}</span>
          </template>
        </Column>

        <Column field="total_orders" header="Pedidos" sortable style="width: 100px">
          <template #body="{ data }">
            <span class="font-semibold text-gray-900">{{ data.total_orders || 0 }}</span>
          </template>
        </Column>

        <Column field="total_spent" header="Total Gastado" sortable style="width: 140px">
          <template #body="{ data }">
            <span class="font-semibold text-gray-900">
              {{ data.total_spent ? formatCurrency(data.total_spent) : '-' }}
            </span>
          </template>
        </Column>

        <Column field="last_order_date" header="Última Compra" sortable style="width: 140px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">
              {{ data.last_order_date ? formatDate(data.last_order_date) : '-' }}
            </span>
          </template>
        </Column>

        <Column field="verified" header="Estado" style="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Tag
                v-if="data.blocked"
                value="Bloqueado"
                severity="danger"
                class="text-xs"
              />
              <Tag
                v-else-if="data.verified"
                value="Verificado"
                severity="success"
                class="text-xs"
              />
              <Tag
                v-else
                value="Activo"
                severity="secondary"
                class="text-xs"
              />
            </div>
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
