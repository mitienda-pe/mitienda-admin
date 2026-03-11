<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import { fulfillmentApi } from '@/api/fulfillment.api'
import type {
  FulfillmentProvider,
  FulfillmentOrder,
  FulfillmentOrdersFilters
} from '@/types/fulfillment.types'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'

const router = useRouter()
const toast = useToast()
const { formatCurrency, formatDate } = useFormatters()

// State
const provider = ref<FulfillmentProvider | null>(null)
const orders = ref<FulfillmentOrder[]>([])
const totalOrders = ref(0)
const totalPages = ref(0)
const isLoading = ref(false)
const isSyncing = ref(false)
const isSyncingStock = ref(false)
const selectedOrders = ref<FulfillmentOrder[]>([])
const isSendingBulk = ref(false)
const stock = ref<any[]>([])
const isLoadingStock = ref(false)

// Filters
const filters = ref<FulfillmentOrdersFilters>({
  status: 'all',
  page: 1,
  per_page: 20
})

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'No enviados', value: 'not_sent' },
  { label: 'Enviados', value: 'sent' },
  { label: 'Con error', value: 'error' },
  { label: 'Procesando', value: 'processing' }
]

// Load provider info
onMounted(async () => {
  try {
    const response = await fulfillmentApi.getProvider()
    provider.value = response.data
    if (provider.value) {
      await loadOrders()
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el proveedor de fulfillment', life: 4000 })
  }
})

// Orders
const loadOrders = async () => {
  isLoading.value = true
  try {
    const response = await fulfillmentApi.getOrders(filters.value)
    orders.value = response.data || []
    totalOrders.value = response.pagination?.total || 0
    totalPages.value = response.pagination?.pages || 0
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las órdenes', life: 4000 })
  } finally {
    isLoading.value = false
  }
}

const onFilterChange = () => {
  filters.value.page = 1
  loadOrders()
}

const onPage = (event: any) => {
  filters.value.page = (event.page || 0) + 1
  filters.value.per_page = event.rows
  loadOrders()
}

const handleSendOrder = async (order: FulfillmentOrder) => {
  const force = order.fulfillment.status === 'error' || order.fulfillment.status === 'sent'
  try {
    const response = await fulfillmentApi.sendToFulfillment(order.order_id, force)
    if (response.data?.success) {
      toast.add({ severity: 'success', summary: 'Enviado', detail: response.data.message, life: 3000 })
      await loadOrders()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: response.data?.message || 'No se pudo enviar', life: 5000 })
    }
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
  }
}

const handleSendBulk = async () => {
  if (selectedOrders.value.length === 0) return
  isSendingBulk.value = true
  try {
    const orderIds = selectedOrders.value.map(o => o.order_id)
    const response = await fulfillmentApi.sendBulk(orderIds, true)
    if (response.data) {
      toast.add({
        severity: response.data.errors > 0 ? 'warn' : 'success',
        summary: 'Envío masivo completado',
        detail: response.data.message,
        life: 5000
      })
      selectedOrders.value = []
      await loadOrders()
    }
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
  } finally {
    isSendingBulk.value = false
  }
}

// Sync tracking
const handleSyncTracking = async () => {
  isSyncing.value = true
  try {
    const response = await fulfillmentApi.syncTracking()
    if (response.data) {
      toast.add({
        severity: 'success',
        summary: 'Tracking sincronizado',
        detail: `${response.data.updated} de ${response.data.total} órdenes actualizadas`,
        life: 4000
      })
      await loadOrders()
    }
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
  } finally {
    isSyncing.value = false
  }
}

// Stock
const loadStock = async () => {
  isLoadingStock.value = true
  try {
    const response = await fulfillmentApi.getWmsStock()
    stock.value = response.data || []
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el stock', life: 4000 })
  } finally {
    isLoadingStock.value = false
  }
}

const handleSyncStock = async () => {
  isSyncingStock.value = true
  try {
    const response = await fulfillmentApi.syncStock()
    if (response.data) {
      toast.add({
        severity: 'success',
        summary: 'Stock sincronizado',
        detail: `${response.data.updated} productos actualizados`,
        life: 4000
      })
      await loadStock()
    }
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 5000 })
  } finally {
    isSyncingStock.value = false
  }
}

// Helpers
const getStatusSeverity = (status: string) => {
  const map: Record<string, string> = {
    not_sent: 'secondary',
    sent: 'success',
    error: 'danger',
    processing: 'warning'
  }
  return map[status] || 'secondary'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    not_sent: 'No enviado',
    sent: 'Enviado',
    error: 'Error',
    processing: 'Procesando'
  }
  return map[status] || status
}

const isUrbanoWms = computed(() => provider.value?.code === 'urbano_wms')

// Stock display helpers
const getAvailableStock = (item: any): number => {
  const stocks = item.stock || []
  for (const s of stocks) {
    if (s.stage === 'DSPN') {
      return Math.max(0, (s.inventario || 0) - (s.reservados || 0))
    }
  }
  return 0
}

const getReservedStock = (item: any): number => {
  const stocks = item.stock || []
  for (const s of stocks) {
    if (s.stage === 'DSPN') {
      return s.reservados || 0
    }
  }
  return 0
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestión de Fulfillment</h1>
        <p v-if="provider" class="text-sm text-gray-500 mt-1">
          Proveedor: <span class="font-medium">{{ provider.name }}</span>
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          label="Sincronizar Tracking"
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          :loading="isSyncing"
          @click="handleSyncTracking"
        />
        <router-link
          v-if="provider"
          :to="`/integrations/providers/${provider.code}`"
        >
          <Button
            label="Configuración"
            icon="pi pi-cog"
            severity="secondary"
            size="small"
            outlined
          />
        </router-link>
      </div>
    </div>

    <!-- No provider configured -->
    <Card v-if="!provider" class="text-center py-12">
      <template #content>
        <div class="flex flex-col items-center gap-4">
          <i class="pi pi-box text-4xl text-gray-300"></i>
          <p class="text-gray-500">No hay proveedor de fulfillment configurado</p>
          <router-link to="/integrations/providers">
            <Button label="Configurar proveedor" icon="pi pi-plus" size="small" />
          </router-link>
        </div>
      </template>
    </Card>

    <!-- Tabs -->
    <TabView v-else>
      <!-- Tab 1: Orders -->
      <TabPanel header="Órdenes">
        <!-- Filters -->
        <div class="flex flex-wrap gap-3 mb-4 items-end">
          <div>
            <label class="text-xs text-gray-500 block mb-1">Estado</label>
            <Dropdown
              v-model="filters.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              class="w-40"
              @change="onFilterChange"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Desde</label>
            <Calendar
              v-model="filters.date_from"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-40"
              @date-select="onFilterChange"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Hasta</label>
            <Calendar
              v-model="filters.date_to"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-40"
              @date-select="onFilterChange"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1">Buscar</label>
            <InputText
              v-model="filters.search"
              placeholder="N° orden, cliente, tracking..."
              class="w-64"
              @keyup.enter="onFilterChange"
            />
          </div>
          <Button
            v-if="selectedOrders.length > 0"
            :label="`Enviar ${selectedOrders.length} seleccionados`"
            icon="pi pi-send"
            size="small"
            :loading="isSendingBulk"
            @click="handleSendBulk"
          />
        </div>

        <!-- Orders table -->
        <DataTable
          :value="orders"
          :loading="isLoading"
          v-model:selection="selectedOrders"
          dataKey="order_id"
          :lazy="true"
          :paginator="true"
          :rows="filters.per_page"
          :totalRecords="totalOrders"
          @page="onPage"
          :rowsPerPageOptions="[10, 20, 50]"
          stripedRows
          size="small"
          class="text-sm"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" />
          <Column field="order_code" header="N° Orden" sortable>
            <template #body="{ data }">
              <router-link :to="`/orders/${data.order_id}`" class="text-primary hover:underline font-mono text-sm">
                {{ data.order_code }}
              </router-link>
            </template>
          </Column>
          <Column field="customer" header="Cliente" />
          <Column field="total" header="Total" sortable>
            <template #body="{ data }">
              {{ formatCurrency(data.total) }}
            </template>
          </Column>
          <Column field="created_at" header="Fecha" sortable>
            <template #body="{ data }">
              {{ formatDate(data.created_at) }}
            </template>
          </Column>
          <Column field="fulfillment.status" header="Estado WMS">
            <template #body="{ data }">
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  {
                    'bg-gray-100 text-gray-600': data.fulfillment.status === 'not_sent',
                    'bg-green-100 text-green-700': data.fulfillment.status === 'sent',
                    'bg-red-100 text-red-700': data.fulfillment.status === 'error',
                    'bg-yellow-100 text-yellow-700': data.fulfillment.status === 'processing'
                  }
                ]"
              >
                {{ getStatusLabel(data.fulfillment.status) }}
              </span>
            </template>
          </Column>
          <Column field="fulfillment.tracking_code" header="Tracking">
            <template #body="{ data }">
              <span v-if="data.fulfillment.tracking_code" class="font-mono text-xs">
                {{ data.fulfillment.tracking_code }}
              </span>
              <span v-else class="text-gray-400 text-xs">—</span>
            </template>
          </Column>
          <Column header="Acción" headerStyle="width: 10rem">
            <template #body="{ data }">
              <Button
                v-if="data.fulfillment.status === 'not_sent'"
                label="Enviar"
                icon="pi pi-send"
                size="small"
                text
                @click="handleSendOrder(data)"
              />
              <Button
                v-else-if="data.fulfillment.status === 'error'"
                label="Reintentar"
                icon="pi pi-refresh"
                severity="warning"
                size="small"
                text
                @click="handleSendOrder(data)"
              />
              <Button
                v-else-if="data.fulfillment.status === 'sent'"
                icon="pi pi-refresh"
                severity="secondary"
                size="small"
                text
                v-tooltip="'Reenviar'"
                @click="handleSendOrder(data)"
              />
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- Tab 2: Stock (only for Urbano WMS) -->
      <TabPanel v-if="isUrbanoWms" header="Stock WMS">
        <div class="flex justify-between items-center mb-4">
          <p class="text-sm text-gray-500">Stock disponible en el almacén WMS</p>
          <div class="flex gap-2">
            <Button
              label="Consultar Stock"
              icon="pi pi-search"
              severity="secondary"
              size="small"
              :loading="isLoadingStock"
              @click="loadStock"
            />
            <Button
              label="Sincronizar Stock"
              icon="pi pi-refresh"
              size="small"
              :loading="isSyncingStock"
              @click="handleSyncStock"
            />
          </div>
        </div>

        <DataTable
          :value="stock"
          :loading="isLoadingStock"
          stripedRows
          size="small"
          class="text-sm"
          :paginator="stock.length > 20"
          :rows="20"
        >
          <Column field="sku_codigo" header="SKU" sortable />
          <Column field="sku_nombre" header="Nombre" />
          <Column header="Disponible">
            <template #body="{ data }">
              <span class="font-mono">
                {{ getAvailableStock(data) }}
              </span>
            </template>
          </Column>
          <Column header="Reservado">
            <template #body="{ data }">
              <span class="font-mono text-gray-500">
                {{ getReservedStock(data) }}
              </span>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-8 text-gray-400">
              <i class="pi pi-box text-3xl mb-2"></i>
              <p>Presiona "Consultar Stock" para ver el inventario del WMS</p>
            </div>
          </template>
        </DataTable>
      </TabPanel>

      <!-- Tab 3: Config -->
      <TabPanel header="Configuración">
        <div class="max-w-lg space-y-6">
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-cog text-primary"></i>
                {{ provider.name }}
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Estado</span>
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      provider.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    ]"
                  >
                    {{ provider.enabled ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Código</span>
                  <span class="font-mono text-sm">{{ provider.code }}</span>
                </div>
                <router-link :to="`/integrations/providers/${provider.code}`">
                  <Button
                    label="Editar credenciales"
                    icon="pi pi-pencil"
                    severity="secondary"
                    size="small"
                    class="w-full mt-2"
                  />
                </router-link>
              </div>
            </template>
          </Card>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

