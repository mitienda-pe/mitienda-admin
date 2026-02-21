<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWebhookSubscriptionsStore } from '@/stores/webhookSubscriptions.store'
import { useToast } from 'primevue/usetoast'
import { AppButton, AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import type { DomainEvent } from '@/types/webhook-subscriptions.types'

const store = useWebhookSubscriptionsStore()
const toast = useToast()

// Filters
const statusFilter = ref<string | null>(null)
const typeFilter = ref<string | null>(null)
const currentPage = ref(1)

// Detail dialog
const showDetail = ref(false)
const selectedEvent = ref<DomainEvent | null>(null)
const detailLoading = ref(false)

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Procesando', value: 'processing' },
  { label: 'Completado', value: 'completed' },
  { label: 'Fallido', value: 'failed' },
  { label: 'Dead Letter', value: 'dead_letter' }
]

const typeOptions = ref<Array<{ label: string; value: string | null }>>([{ label: 'Todos', value: null }])

onMounted(async () => {
  await Promise.all([loadEvents(), store.fetchEventStats(), store.fetchAvailableEvents()])
  typeOptions.value = [
    { label: 'Todos', value: null },
    ...store.availableEvents.map(e => ({ label: e.label, value: e.type }))
  ]
})

async function loadEvents() {
  await store.fetchEvents({
    page: currentPage.value,
    status: statusFilter.value || undefined,
    event_type: typeFilter.value || undefined
  })
}

function onFilterChange() {
  currentPage.value = 1
  loadEvents()
}

function onPage(event: any) {
  currentPage.value = (event.page ?? 0) + 1
  loadEvents()
}

async function openDetail(event: DomainEvent) {
  detailLoading.value = true
  showDetail.value = true
  try {
    const response = await (await import('@/api/webhook-subscriptions.api')).webhookSubscriptionsApi.getEvent(event.id)
    if (response.success && response.data) {
      selectedEvent.value = response.data
    }
  } catch (e) {
    selectedEvent.value = event
  } finally {
    detailLoading.value = false
  }
}

async function retryEvent(event: DomainEvent) {
  const ok = await store.retryEvent(event.id)
  if (ok) {
    toast.add({ severity: 'success', summary: 'Re-encolado', detail: 'Evento enviado para reprocesamiento', life: 3000 })
    showDetail.value = false
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error || 'No se pudo reintentar', life: 3000 })
  }
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    dead_letter: 'danger'
  }
  return map[status] || 'neutral'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Completado',
    failed: 'Fallido',
    dead_letter: 'Dead Letter'
  }
  return map[status] || status
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Registro de Eventos</h1>
      <p class="text-gray-500 mt-1">Monitorea los eventos emitidos por tu tienda y su procesamiento</p>
    </div>

    <!-- Stats Cards -->
    <div v-if="store.eventStats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">Hoy</div>
        <div class="text-2xl font-bold text-gray-800">{{ store.eventStats.today }}</div>
      </div>
      <div v-for="stat in store.eventStats.by_status" :key="stat.status" class="bg-white border rounded-lg p-4">
        <div class="text-sm text-gray-500">{{ getStatusLabel(stat.status) }}</div>
        <div class="text-2xl font-bold" :class="{
          'text-green-600': stat.status === 'completed',
          'text-red-600': stat.status === 'failed' || stat.status === 'dead_letter',
          'text-yellow-600': stat.status === 'pending',
          'text-blue-600': stat.status === 'processing'
        }">
          {{ stat.count }}
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-4 mb-4">
      <Dropdown
        v-model="statusFilter"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Estado"
        class="w-48"
        @change="onFilterChange"
      />
      <Dropdown
        v-model="typeFilter"
        :options="typeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Tipo de evento"
        class="w-56"
        @change="onFilterChange"
      />
      <AppButton variant="secondary" @click="loadEvents">
        <i class="pi pi-refresh mr-2" />
        Actualizar
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="store.eventsLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <AppErrorState v-else-if="store.error" :message="store.error" @retry="loadEvents" />

    <!-- Empty -->
    <AppEmptyState
      v-else-if="!store.events.length"
      title="Sin eventos"
      description="Los eventos aparecerán aquí cuando se creen órdenes, clientes o se actualicen productos"
    />

    <!-- Table -->
    <DataTable
      v-else
      :value="store.events"
      :paginator="true"
      :rows="20"
      :totalRecords="store.eventsMeta?.total ?? 0"
      :lazy="true"
      @page="onPage"
      stripedRows
      class="text-sm"
    >
      <Column header="ID" field="id" style="width: 70px">
        <template #body="{ data }">
          <span class="text-gray-500 font-mono">#{{ data.id }}</span>
        </template>
      </Column>
      <Column header="Tipo" field="event_type">
        <template #body="{ data }">
          <span class="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{{ data.event_type }}</span>
        </template>
      </Column>
      <Column header="Recurso">
        <template #body="{ data }">
          <span class="text-gray-600">{{ data.aggregate_type }} #{{ data.aggregate_id }}</span>
        </template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <AppBadge :variant="getStatusVariant(data.status)">
            {{ getStatusLabel(data.status) }}
          </AppBadge>
        </template>
      </Column>
      <Column header="Fecha">
        <template #body="{ data }">
          {{ new Date(data.created_at).toLocaleString('es-PE') }}
        </template>
      </Column>
      <Column header="Acciones" style="width: 100px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <AppButton variant="text" size="small" @click="openDetail(data)" title="Ver detalle">
              <i class="pi pi-eye" />
            </AppButton>
            <AppButton
              v-if="data.status === 'failed' || data.status === 'dead_letter'"
              variant="text"
              size="small"
              @click="retryEvent(data)"
              title="Reintentar"
            >
              <i class="pi pi-replay text-orange-500" />
            </AppButton>
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Event Detail Dialog -->
    <Dialog
      v-model:visible="showDetail"
      header="Detalle del evento"
      :style="{ width: '700px' }"
      modal
    >
      <div v-if="detailLoading" class="flex justify-center py-8">
        <i class="pi pi-spinner pi-spin text-2xl text-primary" />
      </div>
      <template v-else-if="selectedEvent">
        <div class="space-y-4">
          <!-- Meta -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Tipo:</span>
              <span class="ml-2 font-mono">{{ selectedEvent.event_type }}</span>
            </div>
            <div>
              <span class="text-gray-500">Estado:</span>
              <AppBadge :variant="getStatusVariant(selectedEvent.status)" class="ml-2">
                {{ getStatusLabel(selectedEvent.status) }}
              </AppBadge>
            </div>
            <div>
              <span class="text-gray-500">Creado:</span>
              <span class="ml-2">{{ new Date(selectedEvent.created_at).toLocaleString('es-PE') }}</span>
            </div>
            <div>
              <span class="text-gray-500">Procesado:</span>
              <span class="ml-2">{{ selectedEvent.processed_at ? new Date(selectedEvent.processed_at).toLocaleString('es-PE') : '-' }}</span>
            </div>
            <div v-if="selectedEvent.retry_count > 0">
              <span class="text-gray-500">Reintentos:</span>
              <span class="ml-2 text-orange-600 font-medium">{{ selectedEvent.retry_count }}</span>
            </div>
            <div v-if="selectedEvent.dead_letter_at">
              <span class="text-gray-500">Dead letter:</span>
              <span class="ml-2 text-red-600">{{ new Date(selectedEvent.dead_letter_at).toLocaleString('es-PE') }}</span>
            </div>
          </div>

          <!-- Payload -->
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">Payload</h4>
            <pre class="bg-gray-800 text-green-400 text-xs p-4 rounded overflow-auto max-h-64">{{ JSON.stringify(selectedEvent.payload, null, 2) }}</pre>
          </div>

          <!-- Webhook Deliveries -->
          <div v-if="selectedEvent.deliveries?.length">
            <h4 class="font-semibold text-gray-700 mb-2">Entregas webhook ({{ selectedEvent.deliveries.length }})</h4>
            <div v-for="d in selectedEvent.deliveries" :key="d.id" class="border rounded p-3 mb-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs truncate max-w-xs">{{ d.url }}</span>
                <AppBadge :variant="d.status === 'success' ? 'success' : 'danger'">
                  HTTP {{ d.response_code || 'Error' }}
                </AppBadge>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ d.duration_ms }}ms - {{ new Date(d.created_at).toLocaleString('es-PE') }}
              </div>
            </div>
          </div>

          <!-- Adapter Deliveries -->
          <div v-if="selectedEvent.adapter_deliveries?.length">
            <h4 class="font-semibold text-gray-700 mb-2">Entregas a proveedores ({{ selectedEvent.adapter_deliveries.length }})</h4>
            <div v-for="ad in selectedEvent.adapter_deliveries" :key="ad.id" class="border rounded p-3 mb-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-medium capitalize">{{ ad.provider }}</span>
                <AppBadge :variant="ad.status === 'success' ? 'success' : 'danger'">
                  {{ ad.status === 'success' ? 'Exitoso' : 'Fallido' }}
                </AppBadge>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                <span v-if="ad.duration_ms">{{ ad.duration_ms }}ms - </span>
                {{ new Date(ad.created_at).toLocaleString('es-PE') }}
              </div>
              <div v-if="ad.error_message" class="text-xs text-red-500 mt-1 truncate" :title="ad.error_message">
                {{ ad.error_message }}
              </div>
            </div>
          </div>
        </div>

        <template v-if="selectedEvent.status === 'failed' || selectedEvent.status === 'dead_letter'">
          <div class="mt-4 pt-4 border-t flex justify-end">
            <AppButton variant="primary" @click="retryEvent(selectedEvent!)">
              <i class="pi pi-replay mr-2" />
              Reintentar
            </AppButton>
          </div>
        </template>
      </template>
    </Dialog>
  </div>
</template>
