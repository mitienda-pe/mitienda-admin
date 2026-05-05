<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/orders.store'
import SearchBar from '@/components/common/SearchBar.vue'
import OrderFilters from '@/components/orders/OrderFilters.vue'
import { useFormatters } from '@/composables/useFormatters'
import DataTable, { type DataTableSortEvent, type DataTablePageEvent, type DataTableRowClickEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { Order, OrderStatus } from '@/types/order.types'
import type { OrderFiltersData } from '@/components/orders/OrderFilters.vue'
import type { OrderSortField } from '@/api/orders.api'

const router = useRouter()
const ordersStore = useOrdersStore()
const { formatCurrency, formatDateTime } = useFormatters()

const filters = ref<OrderFiltersData>({
  status: 'all',
  dateFrom: null,
  dateTo: null,
  billed: 'all'
})

onMounted(() => {
  ordersStore.fetchOrders()
})

const handleSearch = (query: string) => {
  ordersStore.setSearch(query)
}

const handleFiltersChange = (newFilters: OrderFiltersData) => {
  const dateFrom = newFilters.dateFrom
    ? newFilters.dateFrom.toISOString().split('T')[0]
    : null
  const dateTo = newFilters.dateTo ? newFilters.dateTo.toISOString().split('T')[0] : null

  ordersStore.setFilters({
    status: newFilters.status,
    dateFrom,
    dateTo,
    billed: newFilters.billed
  })
}

const handleClearFilters = () => {
  filters.value = {
    status: 'all',
    dateFrom: null,
    dateTo: null,
    billed: 'all'
  }
  ordersStore.resetFilters()
}

const handleRowClick = (event: DataTableRowClickEvent) => {
  const order = event.data as Order
  router.push(`/orders/${order.id}`)
}

const onPage = (event: DataTablePageEvent) => {
  if (event.rows !== ordersStore.pagination.limit) {
    ordersStore.setLimit(event.rows)
  } else {
    ordersStore.setPage((event.page ?? 0) + 1)
  }
}

const onSort = (event: DataTableSortEvent) => {
  const field = typeof event.sortField === 'string' ? event.sortField : 'date'
  const dir = event.sortOrder === 1 ? 'asc' : 'desc'
  ordersStore.setSort((field as OrderSortField) || 'date', dir)
}

const sortFieldComputed = computed(() => ordersStore.sort.by)
const sortOrderComputed = computed(() => (ordersStore.sort.dir === 'asc' ? 1 : -1))
const firstRow = computed(() => (ordersStore.pagination.page - 1) * ordersStore.pagination.limit)
const totalOrders = computed(() => ordersStore.pagination.total)

// Estado de pago
const statusConfig = (status: OrderStatus) => {
  const configs: Record<OrderStatus, { label: string; severity: string; icon: string }> = {
    pending:    { label: 'Pendiente',   severity: 'warn',      icon: 'pi-clock' },
    paid:       { label: 'Pagado',      severity: 'success',   icon: 'pi-check-circle' },
    cancelled:  { label: 'Rechazado',   severity: 'danger',    icon: 'pi-times-circle' },
    chargeback: { label: 'Contracargo', severity: 'danger',    icon: 'pi-exclamation-triangle' },
    refunded:   { label: 'Reembolsado', severity: 'warn',      icon: 'pi-replay' },
    processing: { label: 'Procesando',  severity: 'info',      icon: 'pi-spin pi-spinner' },
    shipped:    { label: 'Enviado',     severity: 'info',      icon: 'pi-truck' },
    delivered:  { label: 'Entregado',   severity: 'success',   icon: 'pi-check' }
  }
  return configs[status] || configs.pending
}

// Razón social + RUC para factura, nombre + DNI/doc para boleta
const customerDisplay = (order: Order) => {
  const isFactura = order.customer?.document_type === 'RUC'
  const businessName = order.customer?.business_name?.trim()
  const personalName = order.customer?.name?.trim() || 'Cliente'
  const docNumber = order.customer?.document_number?.trim() || ''
  const docType = order.customer?.document_type?.trim() || ''

  if (isFactura && businessName) {
    return {
      primary: businessName,
      secondary: docNumber ? `RUC ${docNumber}` : 'RUC'
    }
  }

  return {
    primary: personalName,
    secondary: docNumber ? `${docType || 'Doc'} ${docNumber}` : ''
  }
}

const billingNumber = (order: Order) => {
  if (!order.billing_document) return ''
  const { serie, correlative } = order.billing_document
  if (!serie || !correlative) return ''
  return `${serie}-${correlative}`
}

const billingType = (order: Order) => {
  const serie = order.billing_document?.serie || ''
  if (serie.startsWith('F')) return 'Factura'
  if (serie.startsWith('B')) return 'Boleta'
  return 'Comprobante'
}
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
      placeholder="Buscar por número de pedido, cliente, RUC/DNI..."
      @search="handleSearch"
    />

    <!-- Filtros -->
    <OrderFilters
      v-model="filters"
      @update:model-value="handleFiltersChange"
      @clear="handleClearFilters"
    />

    <!-- Error -->
    <div
      v-if="ordersStore.error"
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

    <!-- Tabla -->
    <div v-else class="bg-white rounded-lg shadow">
      <DataTable
        :value="ordersStore.orders"
        :loading="ordersStore.isLoading"
        striped-rows
        responsive-layout="scroll"
        data-key="id"
        :paginator="true"
        :rows="ordersStore.pagination.limit"
        :total-records="ordersStore.pagination.total"
        :first="firstRow"
        lazy
        @page="onPage"
        @sort="onSort"
        @row-click="handleRowClick"
        :sort-field="sortFieldComputed"
        :sort-order="sortOrderComputed"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rows-per-page-options="[10, 20, 50, 100]"
        current-page-report-template="Mostrando {first} a {last} de {totalRecords} pedidos"
        row-hover
        class="cursor-pointer"
      >
        <template #empty>
          <div class="text-center py-12">
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
                ordersStore.filters.dateTo ||
                ordersStore.filters.billed !== 'all'
              "
              label="Limpiar filtros"
              icon="pi pi-filter-slash"
              @click="handleClearFilters"
            />
          </div>
        </template>

        <Column field="code" header="Pedido" :sortable="true">
          <template #body="{ data }">
            <span class="font-medium text-secondary">#{{ data.order_number }}</span>
          </template>
        </Column>

        <Column field="date" header="Fecha" :sortable="true">
          <template #body="{ data }">
            <span class="text-sm text-gray-700">{{ formatDateTime(data.created_at) }}</span>
          </template>
        </Column>

        <Column field="customer" header="Cliente" :sortable="true">
          <template #body="{ data }">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ customerDisplay(data).primary }}</span>
              <span v-if="customerDisplay(data).secondary" class="text-xs text-gray-500 font-mono">
                {{ customerDisplay(data).secondary }}
              </span>
            </div>
          </template>
        </Column>

        <Column field="status" header="Pago" :sortable="true">
          <template #body="{ data }">
            <Tag
              :value="statusConfig(data.status).label"
              :severity="statusConfig(data.status).severity"
              :icon="`pi ${statusConfig(data.status).icon}`"
            />
          </template>
        </Column>

        <Column field="billed" header="Facturación" :sortable="true">
          <template #body="{ data }">
            <div v-if="data.billing_document?.status === 1" class="flex flex-col">
              <Tag value="Facturado" severity="success" icon="pi pi-check-circle" />
              <span v-if="billingNumber(data)" class="text-xs text-gray-600 font-mono mt-1">
                {{ billingType(data) }} {{ billingNumber(data) }}
              </span>
            </div>
            <Tag v-else value="No facturado" severity="secondary" />
          </template>
        </Column>

        <Column field="total" header="Total" :sortable="true">
          <template #body="{ data }">
            <span class="font-semibold text-secondary">{{ formatCurrency(data.total) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
