<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import { dispatchApi } from '@/api/dispatch.api'
import type {
  DispatchOrder,
  DispatchOrdersFilters,
  DispatchState,
  DispatchStats,
  DispatchStateId
} from '@/types/dispatch.types'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const toast = useToast()
const { formatDate } = useFormatters()

// ─── State ────────────────────────────────────────────────────
const orders = ref<DispatchOrder[]>([])
const totalOrders = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)
const stats = ref<DispatchStats>({})
const states = ref<DispatchState[]>([])
const selectedOrders = ref<DispatchOrder[]>([])
const isDispatchEnabled = ref(true)
const dispatchDisabledMessage = ref('')

// Filters
const filters = ref<DispatchOrdersFilters>({
  page: 1,
  per_page: 20
})

// Date wrappers for Calendar (Calendar expects Date, filters use string)
const dateFrom = computed({
  get: () => filters.value.date_from ? new Date(filters.value.date_from + 'T00:00:00') : null,
  set: (val: Date | null) => {
    filters.value.date_from = val ? val.toISOString().slice(0, 10) : undefined
  }
})
const dateTo = computed({
  get: () => filters.value.date_to ? new Date(filters.value.date_to + 'T00:00:00') : null,
  set: (val: Date | null) => {
    filters.value.date_to = val ? val.toISOString().slice(0, 10) : undefined
  }
})
const deliveryDateRef = computed({
  get: () => filters.value.delivery_date ? new Date(filters.value.delivery_date + 'T00:00:00') : null,
  set: (val: Date | null) => {
    filters.value.delivery_date = val ? val.toISOString().slice(0, 10) : undefined
  }
})

// Status change dialog
const showStatusDialog = ref(false)
const statusDialogLoading = ref(false)
const statusForm = ref({
  state_id: null as DispatchStateId | null,
  comentario_cliente: '',
  observacion_reparto: '',
  notify_customer: true
})

const deliveryTypeOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Domicilio', value: 'domicilio' },
  { label: 'Retiro en tienda', value: 'retiro' }
]

// ─── Computed ─────────────────────────────────────────────────

const stateOptions = computed(() => {
  return [
    { label: 'Todos los estados', value: undefined },
    ...states.value.map(s => ({ label: s.name, value: String(s.id) }))
  ]
})

const batchTargetStates = computed(() => {
  // For batch, show common forward states
  return states.value.filter(s => [32, 33, 34, 39].includes(s.id))
})

const statsSummary = computed(() => {
  const groups = [
    { label: 'Pago pendiente', stateIds: ['30'], color: 'bg-blue-100 text-blue-800', icon: 'pi pi-clock' },
    { label: 'Confirmados', stateIds: ['31'], color: 'bg-yellow-100 text-yellow-800', icon: 'pi pi-check' },
    { label: 'Preparando', stateIds: ['32'], color: 'bg-orange-100 text-orange-800', icon: 'pi pi-box' },
    { label: 'En camino / Listo', stateIds: ['33', '39'], color: 'bg-purple-100 text-purple-800', icon: 'pi pi-truck' },
    { label: 'Entregados', stateIds: ['34'], color: 'bg-green-100 text-green-800', icon: 'pi pi-check-circle' },
    { label: 'Problemas', stateIds: ['35', '36', '37', '38'], color: 'bg-red-100 text-red-800', icon: 'pi pi-exclamation-triangle' },
  ]
  return groups.map(g => ({
    ...g,
    count: g.stateIds.reduce((sum, id) => sum + ((stats.value[id] as any)?.count || 0), 0),
    filterValue: g.stateIds.join(',')
  }))
})

// ─── Methods ──────────────────────────────────────────────────

async function loadOrders() {
  isLoading.value = true
  try {
    const response = await dispatchApi.getOrders(filters.value)
    if (response.error !== 0) {
      isDispatchEnabled.value = false
      dispatchDisabledMessage.value = (response as any).message || 'Panel de despacho no habilitado'
      return
    }
    orders.value = response.data
    totalOrders.value = response.pagination.total
    totalPages.value = response.pagination.pages
    isDispatchEnabled.value = true
  } catch (err: any) {
    if (err?.response?.data?.messages?.error) {
      isDispatchEnabled.value = false
      dispatchDisabledMessage.value = err.response.data.messages.error
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pedidos', life: 3000 })
    }
  } finally {
    isLoading.value = false
  }
}

async function loadStats() {
  try {
    const response = await dispatchApi.getStats()
    if (response.error === 0) {
      stats.value = response.data
    }
  } catch {
    // Stats are non-critical
  }
}

async function loadStates() {
  try {
    const response = await dispatchApi.getStates()
    if (response.error === 0) {
      states.value = response.data
    }
  } catch {
    // Use fallback states
    states.value = [
      { id: 30, name: 'Pago pendiente' },
      { id: 31, name: 'Pago confirmado' },
      { id: 32, name: 'Preparando producto' },
      { id: 33, name: 'En camino' },
      { id: 34, name: 'Entregado' },
      { id: 35, name: 'Rechazado' },
      { id: 36, name: 'Cancelado' },
      { id: 37, name: 'Devuelto' },
      { id: 38, name: 'Re-programado' },
      { id: 39, name: 'Orden lista para retiro' },
    ]
  }
}

function onFilterChange() {
  filters.value.page = 1
  selectedOrders.value = []
  loadOrders()
}

function onStatClick(filterValue: string) {
  if (filters.value.dispatch_state === filterValue) {
    filters.value.dispatch_state = undefined
  } else {
    filters.value.dispatch_state = filterValue
  }
  onFilterChange()
}

function clearFilters() {
  filters.value = { page: 1, per_page: 20 }
  selectedOrders.value = []
  loadOrders()
}

function onPage(event: any) {
  filters.value.page = event.page + 1
  filters.value.per_page = event.rows
  loadOrders()
}

function goToDetail(order: DispatchOrder) {
  router.push({ name: 'DispatchDetail', params: { id: order.order_id } })
}

function getStateBadgeClass(stateId: number): string {
  if (stateId === 30) return 'bg-blue-100 text-blue-800'
  if (stateId === 31) return 'bg-yellow-100 text-yellow-800'
  if (stateId === 32) return 'bg-orange-100 text-orange-800'
  if (stateId === 33 || stateId === 39) return 'bg-purple-100 text-purple-800'
  if (stateId === 34) return 'bg-green-100 text-green-800'
  return 'bg-red-100 text-red-800' // 35, 36, 37, 38
}

function getDeliveryIcon(type: string): string {
  return type === 'retiro' ? 'pi pi-building' : 'pi pi-truck'
}

// ─── Batch Status Change ──────────────────────────────────────

function openBatchStatusDialog() {
  statusForm.value = {
    state_id: null,
    comentario_cliente: '',
    observacion_reparto: '',
    notify_customer: true
  }
  showStatusDialog.value = true
}

async function submitBatchStatus() {
  if (!statusForm.value.state_id) {
    toast.add({ severity: 'warn', summary: 'Selecciona un estado', life: 2000 })
    return
  }

  statusDialogLoading.value = true
  try {
    const response = await dispatchApi.batchUpdateStatus({
      order_ids: selectedOrders.value.map(o => o.order_id),
      state_id: statusForm.value.state_id,
      comentario_cliente: statusForm.value.comentario_cliente || undefined,
      notify_customer: statusForm.value.notify_customer
    })

    toast.add({
      severity: response.data.errors > 0 ? 'warn' : 'success',
      summary: 'Estado actualizado',
      detail: response.message,
      life: 4000
    })

    showStatusDialog.value = false
    selectedOrders.value = []
    loadOrders()
    loadStats()
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err?.response?.data?.messages?.error || 'Error al cambiar estados',
      life: 4000
    })
  } finally {
    statusDialogLoading.value = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────

onMounted(() => {
  loadStates()
  loadStats()
  loadOrders()
})
</script>

<template>
  <div class="p-6 max-w-[1400px] mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Despacho</h1>
      <p class="text-sm text-gray-500 mt-1">Gestiona el estado de envío de tus pedidos</p>
    </div>

    <!-- Dispatch not enabled message -->
    <div v-if="!isDispatchEnabled" class="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
      <i class="pi pi-info-circle text-yellow-600 text-4xl mb-4"></i>
      <h2 class="text-lg font-semibold text-yellow-800 mb-2">Panel de Despacho no habilitado</h2>
      <p class="text-yellow-700">{{ dispatchDisabledMessage || 'Activa el panel de despacho desde la configuración de tu tienda para gestionar estados de envío.' }}</p>
    </div>

    <template v-else>
      <!-- Stats bar -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <button
          v-for="stat in statsSummary"
          :key="stat.label"
          @click="onStatClick(stat.filterValue)"
          class="rounded-lg p-3 text-left transition-all border-2"
          :class="[
            stat.color,
            filters.dispatch_state === stat.filterValue
              ? 'border-gray-800 shadow-md'
              : 'border-transparent hover:border-gray-300'
          ]"
        >
          <div class="flex items-center gap-2 mb-1">
            <i :class="stat.icon" class="text-sm"></i>
            <span class="text-xs font-medium">{{ stat.label }}</span>
          </div>
          <span class="text-2xl font-bold">{{ stat.count }}</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="text-xs text-gray-500 block mb-1">Estado</label>
            <Dropdown
              v-model="filters.dispatch_state"
              :options="stateOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-48"
              @change="onFilterChange"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Tipo entrega</label>
            <Dropdown
              v-model="filters.delivery_type"
              :options="deliveryTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-44"
              @change="onFilterChange"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Fecha pedido desde</label>
            <Calendar
              v-model="dateFrom"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-40"
              @date-select="onFilterChange"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Fecha pedido hasta</label>
            <Calendar
              v-model="dateTo"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-40"
              @date-select="onFilterChange"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Fecha entrega</label>
            <Calendar
              v-model="deliveryDateRef"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-40"
              @date-select="onFilterChange"
            />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="text-xs text-gray-500 block mb-1">Buscar</label>
            <InputText
              v-model="filters.search"
              placeholder="Código, nombre cliente..."
              class="w-full"
              @keyup.enter="onFilterChange"
            />
          </div>
          <Button
            icon="pi pi-filter-slash"
            severity="secondary"
            text
            size="small"
            v-tooltip.top="'Limpiar filtros'"
            @click="clearFilters"
          />
        </div>
      </div>

      <!-- Batch action bar -->
      <div
        v-if="selectedOrders.length > 0"
        class="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4 flex items-center justify-between"
      >
        <span class="text-sm font-medium text-primary-800">
          {{ selectedOrders.length }} pedido{{ selectedOrders.length > 1 ? 's' : '' }} seleccionado{{ selectedOrders.length > 1 ? 's' : '' }}
        </span>
        <Button
          label="Cambiar estado"
          icon="pi pi-arrow-right"
          size="small"
          @click="openBatchStatusDialog"
        />
      </div>

      <!-- DataTable -->
      <div class="bg-white rounded-lg shadow-sm border">
        <DataTable
          :value="orders"
          :loading="isLoading"
          v-model:selection="selectedOrders"
          dataKey="order_id"
          :paginator="true"
          :rows="filters.per_page"
          :totalRecords="totalOrders"
          :lazy="true"
          @page="onPage"
          :rowsPerPageOptions="[10, 20, 50]"
          responsiveLayout="scroll"
          stripedRows
          class="dispatch-table"
          :rowClass="() => 'cursor-pointer'"
          @row-click="(e: any) => goToDetail(e.data)"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" @click.stop />

          <Column field="order_code" header="Pedido" :sortable="false" style="min-width: 120px">
            <template #body="{ data }">
              <span class="font-mono font-semibold text-primary">{{ data.order_code }}</span>
            </template>
          </Column>

          <Column field="order_date" header="Fecha" :sortable="false" style="min-width: 100px">
            <template #body="{ data }">
              <span class="text-sm text-gray-600">{{ formatDate(data.order_date) }}</span>
            </template>
          </Column>

          <Column field="customer_name" header="Cliente" :sortable="false" style="min-width: 180px">
            <template #body="{ data }">
              <div>
                <span class="font-medium text-gray-900">{{ data.customer_name }}</span>
                <div v-if="data.delivery_address" class="text-xs text-gray-500 truncate max-w-[250px]">
                  {{ data.delivery_address }}
                </div>
              </div>
            </template>
          </Column>

          <Column field="ubigeo" header="Ubicación" :sortable="false" style="min-width: 140px">
            <template #body="{ data }">
              <span class="text-sm text-gray-600">{{ data.ubigeo || '-' }}</span>
            </template>
          </Column>

          <Column field="delivery_date" header="F. Entrega" :sortable="false" style="min-width: 100px">
            <template #body="{ data }">
              <span class="text-sm text-gray-600">{{ data.delivery_date ? formatDate(data.delivery_date) : '-' }}</span>
            </template>
          </Column>

          <Column field="delivery_type" header="Tipo" :sortable="false" headerStyle="width: 5rem; text-align: center" bodyStyle="text-align: center">
            <template #body="{ data }">
              <i
                :class="getDeliveryIcon(data.delivery_type)"
                class="text-lg"
                v-tooltip.top="data.delivery_type === 'retiro' ? 'Retiro en tienda' : 'Envío a domicilio'"
              ></i>
            </template>
          </Column>

          <Column field="items_count" header="Items" :sortable="false" headerStyle="width: 5rem; text-align: center" bodyStyle="text-align: center">
            <template #body="{ data }">
              <span class="text-sm font-medium">{{ data.items_count }}</span>
            </template>
          </Column>

          <Column field="dispatch_state" header="Estado" :sortable="false" style="min-width: 160px">
            <template #body="{ data }">
              <span
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                :class="getStateBadgeClass(data.dispatch_state.id)"
              >
                {{ data.dispatch_state.name }}
              </span>
            </template>
          </Column>

          <Column header="" headerStyle="width: 4rem" bodyStyle="text-align: center" @click.stop>
            <template #body="{ data }">
              <Button
                icon="pi pi-eye"
                text
                rounded
                size="small"
                v-tooltip.top="'Ver detalle'"
                @click.stop="goToDetail(data)"
              />
            </template>
          </Column>

          <!-- Empty state -->
          <template #empty>
            <div class="py-12 text-center">
              <i class="pi pi-truck text-4xl text-gray-300 mb-4"></i>
              <p class="text-gray-500">No se encontraron pedidos con los filtros seleccionados</p>
              <Button label="Limpiar filtros" text size="small" class="mt-2" @click="clearFilters" />
            </div>
          </template>

          <template #loading>
            <div class="py-12 text-center">
              <ProgressSpinner style="width: 40px; height: 40px" />
              <p class="text-gray-500 mt-2">Cargando pedidos...</p>
            </div>
          </template>
        </DataTable>
      </div>
    </template>

    <!-- Batch Status Change Dialog -->
    <Dialog
      v-model:visible="showStatusDialog"
      header="Cambiar estado de despacho"
      :modal="true"
      :style="{ width: '500px' }"
      :closable="!statusDialogLoading"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Se actualizará el estado de <strong>{{ selectedOrders.length }}</strong> pedido{{ selectedOrders.length > 1 ? 's' : '' }}.
        </p>

        <div>
          <label class="text-sm font-medium text-gray-700 block mb-1">Nuevo estado</label>
          <Dropdown
            v-model="statusForm.state_id"
            :options="batchTargetStates"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar estado"
            class="w-full"
          />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 block mb-1">Comentario para el cliente</label>
          <Textarea
            v-model="statusForm.comentario_cliente"
            rows="3"
            class="w-full"
            placeholder="Este mensaje se incluirá en el email de notificación al cliente"
          />
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            v-model="statusForm.notify_customer"
            :binary="true"
            inputId="notify_batch"
          />
          <label for="notify_batch" class="text-sm text-gray-700">Enviar email de notificación al cliente</label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            text
            @click="showStatusDialog = false"
            :disabled="statusDialogLoading"
          />
          <Button
            label="Cambiar estado"
            icon="pi pi-check"
            @click="submitBatchStatus"
            :loading="statusDialogLoading"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.dispatch-table .p-datatable-tbody > tr) {
  transition: background-color 0.15s;
}
:deep(.dispatch-table .p-datatable-tbody > tr:hover) {
  background-color: rgb(243 244 246) !important;
}
</style>
