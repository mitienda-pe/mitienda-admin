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
  DispatchStateId
} from '@/types/dispatch.types'
import SearchBar from '@/components/common/SearchBar.vue'
import DataTable, { type DataTablePageEvent, type DataTableRowClickEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'

const router = useRouter()
const toast = useToast()
const { formatDate } = useFormatters()

// ─── State ────────────────────────────────────────────────────
const orders = ref<DispatchOrder[]>([])
const totalOrders = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)
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
  return states.value.filter(s => [32, 33, 34, 39].includes(s.id))
})

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.value.search ||
    filters.value.dispatch_state ||
    filters.value.delivery_type ||
    filters.value.date_from ||
    filters.value.date_to ||
    filters.value.delivery_date
  )
})

const firstRow = computed(() => ((filters.value.page ?? 1) - 1) * (filters.value.per_page ?? 20))

// ─── Methods ──────────────────────────────────────────────────

async function loadOrders() {
  isLoading.value = true
  try {
    const response = await dispatchApi.getOrders(filters.value)
    if (!response.success) {
      if (response.message?.includes('no habilitado')) {
        isDispatchEnabled.value = false
        dispatchDisabledMessage.value = response.message
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: response.message || 'No se pudieron cargar los pedidos', life: 3000 })
      }
      return
    }
    orders.value = response.data
    totalOrders.value = response.pagination.total
    totalPages.value = response.pagination.pages
    isDispatchEnabled.value = true
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pedidos', life: 3000 })
  } finally {
    isLoading.value = false
  }
}

async function loadStates() {
  try {
    const response = await dispatchApi.getStates()
    if (response.success) {
      states.value = response.data
    }
  } catch {
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

function handleSearch(query: string) {
  filters.value.search = query || undefined
  filters.value.page = 1
  selectedOrders.value = []
  loadOrders()
}

function onFilterChange() {
  filters.value.page = 1
  selectedOrders.value = []
  loadOrders()
}

function clearFilters() {
  filters.value = { page: 1, per_page: filters.value.per_page ?? 20 }
  selectedOrders.value = []
  loadOrders()
}

function onPage(event: DataTablePageEvent) {
  filters.value.page = (event.page ?? 0) + 1
  filters.value.per_page = event.rows
  loadOrders()
}

function handleRowClick(event: DataTableRowClickEvent) {
  const order = event.data as DispatchOrder
  router.push({ name: 'DispatchDetail', params: { id: order.order_id } })
}

// Estado de despacho → severity + icono (estilo Tag de PrimeVue, igual que OrdersListView)
const dispatchStateConfig = (stateId: number) => {
  const map: Record<number, { severity: string; icon: string }> = {
    30: { severity: 'warn',      icon: 'pi-clock' },
    31: { severity: 'info',      icon: 'pi-check' },
    32: { severity: 'warn',      icon: 'pi-box' },
    33: { severity: 'info',      icon: 'pi-truck' },
    34: { severity: 'success',   icon: 'pi-check-circle' },
    35: { severity: 'danger',    icon: 'pi-times-circle' },
    36: { severity: 'danger',    icon: 'pi-times-circle' },
    37: { severity: 'danger',    icon: 'pi-replay' },
    38: { severity: 'warn',      icon: 'pi-history' },
    39: { severity: 'info',      icon: 'pi-building' },
  }
  return map[stateId] ?? { severity: 'secondary', icon: 'pi-circle' }
}

const deliveryTypeLabel = (type: string) =>
  type === 'retiro' ? 'Retiro en tienda' : 'Envío a domicilio'
const deliveryTypeIcon = (type: string) =>
  type === 'retiro' ? 'pi-building' : 'pi-truck'

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

async function checkEnabledAndLoad() {
  // Quick check con stats (lightweight) para detectar si dispatch está habilitado
  try {
    const response = await dispatchApi.getStats()
    if (response.success) {
      isDispatchEnabled.value = true
      loadStates()
      loadOrders()
    } else if (response.message?.includes('no habilitado')) {
      isDispatchEnabled.value = false
      dispatchDisabledMessage.value = response.message
    } else {
      isDispatchEnabled.value = true
      loadStates()
      loadOrders()
    }
  } catch {
    isDispatchEnabled.value = true
    loadStates()
    loadOrders()
  }
}

onMounted(() => {
  checkEnabledAndLoad()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Despacho</h1>
        <p v-if="!isLoading" class="text-gray-600 mt-1">
          {{ totalOrders }} {{ totalOrders === 1 ? 'pedido' : 'pedidos' }}
        </p>
      </div>
    </div>

    <!-- Dispatch not enabled message -->
    <div v-if="!isDispatchEnabled" class="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
      <i class="pi pi-info-circle text-yellow-600 text-4xl mb-4"></i>
      <h2 class="text-lg font-semibold text-yellow-800 mb-2">Panel de Despacho no habilitado</h2>
      <p class="text-yellow-700">{{ dispatchDisabledMessage || 'Activa el panel de despacho desde la configuración de tu tienda para gestionar estados de envío.' }}</p>
    </div>

    <template v-else>
      <!-- Búsqueda -->
      <SearchBar
        :model-value="filters.search ?? ''"
        placeholder="Buscar por código de pedido o nombre del cliente..."
        @search="handleSearch"
      />

      <!-- Filtros -->
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex flex-col md:flex-row md:items-end gap-4 flex-wrap">
          <!-- Estado de despacho -->
          <div class="flex-1 min-w-[180px]">
            <label class="block text-sm font-medium text-gray-700 mb-2">Estado de Despacho</label>
            <Dropdown
              v-model="filters.dispatch_state"
              :options="stateOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos"
              class="w-full"
              @change="onFilterChange"
            />
          </div>

          <!-- Tipo de entrega -->
          <div class="flex-1 min-w-[180px]">
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de entrega</label>
            <Dropdown
              v-model="filters.delivery_type"
              :options="deliveryTypeOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos"
              class="w-full"
              @change="onFilterChange"
            />
          </div>

          <!-- Fecha desde -->
          <div class="flex-1 min-w-[160px]">
            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha desde</label>
            <Calendar
              v-model="dateFrom"
              placeholder="Seleccionar fecha"
              date-format="dd/mm/yy"
              show-icon
              :show-clear="true"
              :max-date="dateTo || new Date()"
              class="w-full"
              @date-select="onFilterChange"
              @clear-click="onFilterChange"
            />
          </div>

          <!-- Fecha hasta -->
          <div class="flex-1 min-w-[160px]">
            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha hasta</label>
            <Calendar
              v-model="dateTo"
              placeholder="Seleccionar fecha"
              date-format="dd/mm/yy"
              show-icon
              :show-clear="true"
              :min-date="dateFrom || undefined"
              :max-date="new Date()"
              class="w-full"
              @date-select="onFilterChange"
              @clear-click="onFilterChange"
            />
          </div>

          <!-- Fecha de entrega -->
          <div class="flex-1 min-w-[160px]">
            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de entrega</label>
            <Calendar
              v-model="deliveryDateRef"
              placeholder="Seleccionar fecha"
              date-format="dd/mm/yy"
              show-icon
              :show-clear="true"
              class="w-full"
              @date-select="onFilterChange"
              @clear-click="onFilterChange"
            />
          </div>

          <!-- Botón limpiar -->
          <div>
            <Button
              v-if="hasActiveFilters"
              label="Limpiar"
              icon="pi pi-filter-slash"
              outlined
              @click="clearFilters"
            />
          </div>
        </div>
      </div>

      <!-- Barra de acción para selección múltiple -->
      <div
        v-if="selectedOrders.length > 0"
        class="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between"
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

      <!-- Tabla -->
      <div class="bg-white rounded-lg shadow">
        <DataTable
          :value="orders"
          :loading="isLoading"
          v-model:selection="selectedOrders"
          striped-rows
          responsive-layout="scroll"
          data-key="order_id"
          :paginator="true"
          :rows="filters.per_page ?? 20"
          :total-records="totalOrders"
          :first="firstRow"
          lazy
          @page="onPage"
          @row-click="handleRowClick"
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rows-per-page-options="[10, 20, 50, 100]"
          current-page-report-template="Mostrando {first} a {last} de {totalRecords} pedidos"
          row-hover
          class="cursor-pointer"
        >
          <template #empty>
            <div class="text-center py-12">
              <i class="pi pi-truck text-6xl text-gray-300 mb-4"></i>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay pedidos</h3>
              <p class="text-gray-600 mb-4">
                No se encontraron pedidos con los filtros seleccionados
              </p>
              <Button
                v-if="hasActiveFilters"
                label="Limpiar filtros"
                icon="pi pi-filter-slash"
                @click="clearFilters"
              />
            </div>
          </template>

          <Column selection-mode="multiple" header-style="width: 3rem" @click.stop />

          <Column field="order_code" header="Pedido">
            <template #body="{ data }">
              <span class="font-medium text-secondary">#{{ data.order_code }}</span>
            </template>
          </Column>

          <Column field="order_date" header="Fecha">
            <template #body="{ data }">
              <span class="text-sm text-gray-700">{{ formatDate(data.order_date) }}</span>
            </template>
          </Column>

          <Column field="customer_name" header="Cliente">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-medium text-gray-900">{{ data.customer_name }}</span>
                <span v-if="data.delivery_address" class="text-xs text-gray-500 truncate max-w-[280px]">
                  {{ data.delivery_address }}
                </span>
              </div>
            </template>
          </Column>

          <Column field="ubigeo" header="Ubicación">
            <template #body="{ data }">
              <span class="text-sm text-gray-700">{{ data.ubigeo || '-' }}</span>
            </template>
          </Column>

          <Column field="delivery_date" header="F. entrega">
            <template #body="{ data }">
              <span class="text-sm text-gray-700">{{ data.delivery_date ? formatDate(data.delivery_date) : '-' }}</span>
            </template>
          </Column>

          <Column field="delivery_type" header="Tipo" header-style="width: 6rem; text-align: center" body-style="text-align: center">
            <template #body="{ data }">
              <i
                :class="`pi ${deliveryTypeIcon(data.delivery_type)}`"
                class="text-lg text-gray-700"
                v-tooltip.top="deliveryTypeLabel(data.delivery_type)"
              ></i>
            </template>
          </Column>

          <Column field="items_count" header="Items" header-style="width: 5rem; text-align: center" body-style="text-align: center">
            <template #body="{ data }">
              <span class="text-sm font-medium">{{ data.items_count }}</span>
            </template>
          </Column>

          <Column field="dispatch_state" header="Estado">
            <template #body="{ data }">
              <Tag
                :value="data.dispatch_state.name"
                :severity="dispatchStateConfig(data.dispatch_state.id).severity"
                :icon="`pi ${dispatchStateConfig(data.dispatch_state.id).icon}`"
              />
            </template>
          </Column>

          <Column header-style="width: 4rem" body-style="text-align: center" @click.stop>
            <template #body="{ data }">
              <Button
                icon="pi pi-eye"
                text
                rounded
                size="small"
                v-tooltip.top="'Ver detalle'"
                @click.stop="router.push({ name: 'DispatchDetail', params: { id: data.order_id } })"
              />
            </template>
          </Column>
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
            option-label="name"
            option-value="id"
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
            input-id="notify_batch"
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
