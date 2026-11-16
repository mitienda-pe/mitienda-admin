<script setup lang="ts">
import BenefitSlot from '@/components/benefits/BenefitSlot.vue'
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/orders.store'
import { usePlanStore } from '@/stores/plan.store'
import SearchBar from '@/components/common/SearchBar.vue'
import OrderFilters from '@/components/orders/OrderFilters.vue'
import { useFormatters } from '@/composables/useFormatters'
import { isAttendableService, useServiceAttended } from '@/composables/useServiceAttended'
import DataTable, { type DataTableSortEvent, type DataTablePageEvent, type DataTableRowClickEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import type { Order, OrderStatus } from '@/types/order.types'
import type { OrderFiltersData } from '@/components/orders/OrderFilters.vue'
import type { OrderSortField } from '@/api/orders.api'

const router = useRouter()
const ordersStore = useOrdersStore()
const planStore = usePlanStore()
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

// La columna aplica a tiendas con el panel de Despacho habilitado; en el resto
// los estados 30-39 nunca se registran y saldría siempre vacía. La excepción son
// los pedidos de servicios, que se cierran desde acá aunque no haya panel.
const hasServiceOrders = computed(() => ordersStore.orders.some(o => o.service_only === true))
const showDispatchColumn = computed(() =>
  planStore.isModuleEnabled('mod_panel_despacho') || hasServiceOrders.value
)

// ─── Servicios por atender ───────────────────────────────────────────────
// Un servicio no se despacha. Se cierra con "Marcar como atendido", de a uno
// o en lote sobre los pedidos de la página.
const toast = useToast()
const { isSaving: isAttending, markAttended } = useServiceAttended()

const attendableOrders = computed(() => ordersStore.orders.filter(isAttendableService))
const selectedIds = ref<Set<number>>(new Set())
const showAttendDialog = ref(false)
const notifyCustomers = ref(false)

// La selección vale solo para la página visible
watch(() => ordersStore.orders, () => { selectedIds.value = new Set() })

const allAttendableSelected = computed(() =>
  attendableOrders.value.length > 0
  && attendableOrders.value.every(o => selectedIds.value.has(o.id))
)

const toggleSelected = (id: number) => {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

const toggleAllAttendable = () => {
  selectedIds.value = allAttendableSelected.value
    ? new Set()
    : new Set(attendableOrders.value.map(o => o.id))
}

const showOnlyPendingServices = () => {
  filters.value = { ...filters.value, status: 'service_pending' }
  handleFiltersChange(filters.value)
}

const confirmAttend = async () => {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return

  try {
    const { success, errors } = await markAttended(ids, notifyCustomers.value)
    toast.add({
      severity: errors > 0 ? 'warn' : 'success',
      summary: success === 1 ? 'Pedido atendido' : 'Pedidos atendidos',
      detail: errors > 0
        ? `${success} marcados como atendidos, ${errors} no se pudieron cambiar`
        : `${success} ${success === 1 ? 'pedido marcado' : 'pedidos marcados'} como atendidos`,
      life: 4000
    })
    showAttendDialog.value = false
    ordersStore.fetchOrders()
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err?.response?.data?.messages?.error || 'No se pudieron marcar los pedidos como atendidos',
      life: 4000
    })
  }
}

// Sincronización con el ERP/WMS. El backend solo manda `sync` en las órdenes de
// tiendas con una integración que escriba estado; sin eso la columna sobra.
const showSyncColumn = computed(() => ordersStore.orders.some(o => Boolean(o.sync)))

const syncSeverity = (status: string) => {
  if (status === 'synced') return 'success'
  if (status === 'error') return 'danger'
  if (status === 'pending') return 'warn'
  return 'secondary'
}

const syncIcon = (status: string) => {
  if (status === 'synced') return 'pi pi-check-circle'
  if (status === 'error') return 'pi pi-times-circle'
  if (status === 'pending') return 'pi pi-clock'
  return 'pi pi-question-circle'
}

// Solo "Entregado" (34) se destaca en verde: es el estado que dispara la
// facturación. Los cierres en falso (rechazado, cancelado, devuelto) van en rojo.
const dispatchSeverity = (stateId: number) => {
  if (stateId === 34) return 'success'
  if (stateId >= 35 && stateId <= 37) return 'danger'
  if (stateId === 33 || stateId === 39) return 'info'
  return 'secondary'
}

// Estado de pago
const statusConfig = (status: OrderStatus) => {
  const configs: Record<OrderStatus, { label: string; severity: string; icon: string }> = {
    created:    { label: 'Sin pago',    severity: 'secondary', icon: 'pi-circle' },
    pending:    { label: 'Pendiente',   severity: 'warn',      icon: 'pi-clock' },
    paid:       { label: 'Pagado',      severity: 'success',   icon: 'pi-check-circle' },
    cancelled:  { label: 'Rechazado',   severity: 'danger',    icon: 'pi-times-circle' },
    voided:     { label: 'Anulado',     severity: 'danger',    icon: 'pi-ban' },
    expired:    { label: 'Expirado',    severity: 'secondary', icon: 'pi-hourglass' },
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

// Bandeja de entrada: las ventas que nadie abrió van en negrita.
const rowClass = (order: Order) => (order.viewed === false ? 'order-unread' : '')

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
      placeholder="Buscar por número de pedido, cliente, RUC/DNI, teléfono..."
      @search="handleSearch"
    />

    <!-- Filtros -->
    <OrderFilters
      v-model="filters"
      @update:model-value="handleFiltersChange"
      @clear="handleClearFilters"
    />

    <!-- Servicios por atender: un servicio no se despacha, se marca atendido -->
    <div
      v-if="!ordersStore.error && attendableOrders.length > 0"
      class="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-briefcase mt-0.5 text-primary"></i>
        <div>
          <p class="font-medium text-gray-900">
            {{ attendableOrders.length }}
            {{ attendableOrders.length === 1 ? 'pedido de servicios por atender' : 'pedidos de servicios por atender' }}
            en esta página
          </p>
          <p class="text-sm text-gray-600">
            Selecciónalos y márcalos como atendidos cuando el servicio se haya realizado.
            <button
              v-if="filters.status !== 'service_pending'"
              type="button"
              class="font-medium text-primary hover:underline"
              @click="showOnlyPendingServices"
            >
              Ver solo los servicios por atender
            </button>
          </p>
        </div>
      </div>
      <div class="flex shrink-0 gap-2">
        <Button
          :label="allAttendableSelected ? 'Quitar selección' : 'Seleccionar todos'"
          severity="secondary"
          outlined
          size="small"
          @click="toggleAllAttendable"
        />
        <Button
          :label="`Marcar como atendidos${selectedIds.size ? ` (${selectedIds.size})` : ''}`"
          icon="pi pi-check"
          size="small"
          :disabled="selectedIds.size === 0"
          @click="showAttendDialog = true"
        />
      </div>
    </div>

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
        :row-class="rowClass"
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

        <!-- Selección: solo para pedidos de servicios por atender -->
        <Column v-if="attendableOrders.length > 0" header="" style="width: 3rem">
          <template #body="{ data }">
            <div v-if="isAttendableService(data)" @click.stop>
              <Checkbox
                :model-value="selectedIds.has(data.id)"
                binary
                :aria-label="`Seleccionar pedido ${data.order_number}`"
                @update:model-value="toggleSelected(data.id)"
              />
            </div>
          </template>
        </Column>

        <Column field="code" header="Pedido" :sortable="true">
          <template #body="{ data }">
            <span class="inline-flex items-center gap-2">
              <span
                v-if="data.viewed === false"
                class="w-2 h-2 rounded-full bg-primary shrink-0"
                aria-label="No visto"
              ></span>
              <span class="font-medium text-secondary">#{{ data.order_number }}</span>
            </span>
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
            <div class="flex flex-col items-start gap-1">
              <Tag
                :value="statusConfig(data.status).label"
                :severity="statusConfig(data.status).severity"
                :icon="`pi ${statusConfig(data.status).icon}`"
              />
              <!-- Pago parcial: el pedido sigue pendiente hasta cubrir el saldo. -->
              <span
                v-if="data.partial_payment && data.partial_payment.balance > 0"
                class="text-xs text-gray-600"
              >
                Debe {{ formatCurrency(data.partial_payment.balance) }}
              </span>
            </div>
          </template>
        </Column>

        <!-- Estado de despacho: se factura cuando el pedido figura entregado, así
             que verlo acá evita entrar orden por orden o cruzar contra Despacho. -->
        <Column v-if="showDispatchColumn" field="dispatch_state" header="Despacho">
          <template #body="{ data }">
            <Tag
              v-if="data.dispatch_state?.name"
              :value="data.dispatch_state.name"
              :severity="dispatchSeverity(data.dispatch_state.id)"
            />
            <span v-else class="text-gray-400 text-sm">—</span>
          </template>
        </Column>

        <!-- Estado del envío de la orden al ERP/WMS. Una venta que no llegó al
             ERP no está en la contabilidad del vendedor, y hasta ahora eso solo
             se veía entrando orden por orden. -->
        <Column v-if="showSyncColumn" field="sync" header="Sync">
          <template #body="{ data }">
            <Tag
              v-if="data.sync"
              v-tooltip.top="data.sync.name"
              :value="data.sync.status_label"
              :severity="syncSeverity(data.sync.status)"
              :icon="syncIcon(data.sync.status)"
            />
            <span v-else class="text-gray-400 text-sm">—</span>
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

    <Dialog
      v-model:visible="showAttendDialog"
      modal
      header="Marcar como atendidos"
      :style="{ width: '28rem' }"
      :breakpoints="{ '640px': '92vw' }"
    >
      <div class="space-y-4">
        <p class="text-gray-700">
          {{ selectedIds.size === 1
            ? 'El pedido seleccionado quedará como "Servicio atendido".'
            : `Los ${selectedIds.size} pedidos seleccionados quedarán como "Servicio atendido".` }}
        </p>
        <label class="flex items-start gap-2 text-sm text-gray-700">
          <Checkbox v-model="notifyCustomers" binary input-id="notify-attended" />
          <span>Avisar por correo a cada cliente que su servicio fue atendido</span>
        </label>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showAttendDialog = false" />
        <Button label="Marcar como atendidos" icon="pi pi-check" :loading="isAttending" @click="confirmAttend" />
      </template>
    </Dialog>

    <BenefitSlot class="mt-6" placement="orders" />
  </div>
</template>

<style scoped>
/* Negrita en toda la fila, incluido lo que trae font-medium/font-semibold. */
:deep(.order-unread td),
:deep(.order-unread td *) {
  font-weight: 700;
}
</style>
