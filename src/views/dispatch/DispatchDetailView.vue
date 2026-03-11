<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import { dispatchApi } from '@/api/dispatch.api'
import type { DispatchOrderDetail, DispatchState, DispatchStateId } from '@/types/dispatch.types'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Timeline from 'primevue/timeline'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { formatDate, formatDateTime, formatCurrency } = useFormatters()

const orderId = Number(route.params.id)

// ─── State ────────────────────────────────────────────────────
const order = ref<DispatchOrderDetail | null>(null)
const isLoading = ref(false)
const showPrices = ref(false)
const states = ref<DispatchState[]>([])

// Status change form
const statusForm = ref({
  state_id: null as DispatchStateId | null,
  comentario_cliente: '',
  observacion_reparto: '',
  notify_customer: true
})
const isChangingStatus = ref(false)

// ─── Computed ─────────────────────────────────────────────────

const availableStates = computed(() => {
  if (!order.value) return []
  return states.value.filter(s => order.value!.available_transitions.includes(s.id))
})

const currentStateBadgeClass = computed(() => {
  if (!order.value) return ''
  return getStateBadgeClass(order.value.dispatch_state.id)
})

const deliveryTypeLabel = computed(() => {
  if (!order.value) return ''
  return order.value.delivery.type === 'retiro' ? 'Retiro en tienda' : 'Envío a domicilio'
})

const deliveryIcon = computed(() => {
  if (!order.value) return 'pi pi-truck'
  return order.value.delivery.type === 'retiro' ? 'pi pi-building' : 'pi pi-truck'
})

// ─── Methods ──────────────────────────────────────────────────

async function loadOrder() {
  isLoading.value = true
  try {
    const mode = showPrices.value ? undefined : 'picking'
    const response = await dispatchApi.getOrder(orderId, mode)
    if (response.error === 0) {
      order.value = response.data
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err?.response?.data?.messages?.error || 'No se pudo cargar el pedido',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

async function loadStates() {
  try {
    const response = await dispatchApi.getStates()
    if (response.error === 0) {
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

async function submitStatusChange() {
  if (!statusForm.value.state_id) {
    toast.add({ severity: 'warn', summary: 'Selecciona un estado', life: 2000 })
    return
  }

  isChangingStatus.value = true
  try {
    const response = await dispatchApi.updateStatus(orderId, {
      state_id: statusForm.value.state_id,
      comentario_cliente: statusForm.value.comentario_cliente || undefined,
      observacion_reparto: statusForm.value.observacion_reparto || undefined,
      notify_customer: statusForm.value.notify_customer
    })

    toast.add({ severity: 'success', summary: 'Estado actualizado', detail: response.message, life: 3000 })

    // Reset form and reload
    statusForm.value = {
      state_id: null,
      comentario_cliente: '',
      observacion_reparto: '',
      notify_customer: true
    }
    await loadOrder()
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err?.response?.data?.messages?.error || 'Error al cambiar estado',
      life: 4000
    })
  } finally {
    isChangingStatus.value = false
  }
}

function togglePrices() {
  showPrices.value = !showPrices.value
  loadOrder()
}

function goBack() {
  router.push({ name: 'Dispatch' })
}

function goToOrder() {
  router.push({ name: 'OrderDetail', params: { id: orderId } })
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.add({ severity: 'info', summary: 'Copiado', life: 1500 })
}

function getStateBadgeClass(stateId: number): string {
  if (stateId === 30) return 'bg-blue-100 text-blue-800'
  if (stateId === 31) return 'bg-yellow-100 text-yellow-800'
  if (stateId === 32) return 'bg-orange-100 text-orange-800'
  if (stateId === 33 || stateId === 39) return 'bg-purple-100 text-purple-800'
  if (stateId === 34) return 'bg-green-100 text-green-800'
  return 'bg-red-100 text-red-800'
}

function getTimelineIcon(stateId: number): string {
  if (stateId === 30) return 'pi pi-clock'
  if (stateId === 31) return 'pi pi-dollar'
  if (stateId === 32) return 'pi pi-box'
  if (stateId === 33) return 'pi pi-truck'
  if (stateId === 34) return 'pi pi-check-circle'
  if (stateId === 35) return 'pi pi-times-circle'
  if (stateId === 36) return 'pi pi-ban'
  if (stateId === 37) return 'pi pi-replay'
  if (stateId === 38) return 'pi pi-calendar'
  if (stateId === 39) return 'pi pi-building'
  return 'pi pi-circle'
}

function getTimelineColor(stateId: number): string {
  if (stateId === 30) return '#3b82f6'
  if (stateId === 31) return '#eab308'
  if (stateId === 32) return '#f97316'
  if (stateId === 33 || stateId === 39) return '#a855f7'
  if (stateId === 34) return '#22c55e'
  return '#ef4444'
}

// ─── Lifecycle ────────────────────────────────────────────────

onMounted(() => {
  loadStates()
  loadOrder()
})
</script>

<template>
  <div class="p-6 max-w-[1400px] mx-auto">
    <!-- Loading -->
    <div v-if="isLoading && !order" class="py-20 text-center">
      <ProgressSpinner style="width: 50px; height: 50px" />
      <p class="text-gray-500 mt-4">Cargando pedido...</p>
    </div>

    <!-- Content -->
    <template v-else-if="order">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <Button icon="pi pi-arrow-left" text rounded @click="goBack" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Pedido {{ order.order_code }}
            </h1>
            <p class="text-sm text-gray-500">{{ formatDateTime(order.order_date) }}</p>
          </div>
          <span
            class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
            :class="currentStateBadgeClass"
          >
            {{ order.dispatch_state.name }}
          </span>
        </div>
        <Button
          label="Ver en Pedidos"
          icon="pi pi-external-link"
          severity="secondary"
          text
          size="small"
          @click="goToOrder"
        />
      </div>

      <!-- Two column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left column (2/3) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer & Delivery info -->
          <div class="bg-white rounded-lg shadow-sm border p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Customer -->
              <div>
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Cliente</h3>
                <div class="space-y-2">
                  <p class="font-medium text-gray-900">{{ order.customer.name }}</p>
                  <p v-if="order.customer.phone" class="text-sm text-gray-600">
                    <i class="pi pi-phone text-xs mr-1"></i> {{ order.customer.phone }}
                  </p>
                  <p v-if="order.customer.email" class="text-sm text-gray-600">
                    <i class="pi pi-envelope text-xs mr-1"></i> {{ order.customer.email }}
                  </p>
                  <div v-if="order.recipient.name?.trim()" class="mt-3 pt-3 border-t">
                    <p class="text-xs text-gray-400 uppercase mb-1">Destinatario</p>
                    <p class="text-sm text-gray-900">{{ order.recipient.name }}</p>
                    <p v-if="order.recipient.phone" class="text-sm text-gray-600">
                      <i class="pi pi-phone text-xs mr-1"></i> {{ order.recipient.phone }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Delivery -->
              <div>
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Entrega</h3>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <i :class="deliveryIcon" class="text-primary"></i>
                    <span class="font-medium text-gray-900">{{ deliveryTypeLabel }}</span>
                  </div>
                  <p class="text-sm text-gray-600">{{ order.delivery.address }}</p>
                  <p v-if="order.delivery.ubigeo" class="text-sm text-gray-500">{{ order.delivery.ubigeo }}</p>
                  <p v-if="order.delivery.reference" class="text-sm text-gray-500">
                    <span class="text-gray-400">Ref:</span> {{ order.delivery.reference }}
                  </p>
                  <p v-if="order.delivery.scheduled_date" class="text-sm text-gray-600">
                    <i class="pi pi-calendar text-xs mr-1"></i>
                    Programado: {{ formatDate(order.delivery.scheduled_date) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Tracking -->
            <div v-if="order.tracking.code || order.tracking.url" class="mt-4 pt-4 border-t">
              <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Tracking</h3>
              <div class="flex items-center gap-3">
                <span v-if="order.tracking.code" class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {{ order.tracking.code }}
                </span>
                <Button
                  v-if="order.tracking.code"
                  icon="pi pi-copy"
                  text
                  rounded
                  size="small"
                  @click="copyToClipboard(order.tracking.code!)"
                />
                <a
                  v-if="order.tracking.url"
                  :href="order.tracking.url"
                  target="_blank"
                  class="text-primary text-sm hover:underline"
                >
                  <i class="pi pi-external-link text-xs mr-1"></i> Ver tracking
                </a>
              </div>
            </div>

            <!-- Observation -->
            <div v-if="order.observation" class="mt-4 pt-4 border-t">
              <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Observación del cliente</h3>
              <p class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{{ order.observation }}</p>
            </div>
          </div>

          <!-- Items table (picking list) -->
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="flex items-center justify-between p-4 border-b">
              <h3 class="font-semibold text-gray-900">
                Productos ({{ order.items.length }})
              </h3>
              <Button
                :label="showPrices ? 'Ocultar precios' : 'Mostrar precios'"
                :icon="showPrices ? 'pi pi-eye-slash' : 'pi pi-eye'"
                severity="secondary"
                text
                size="small"
                @click="togglePrices"
              />
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th class="px-4 py-3 w-16"></th>
                    <th class="px-4 py-3">SKU</th>
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3 text-center">Cantidad</th>
                    <th v-if="showPrices" class="px-4 py-3 text-right">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, idx) in order.items"
                    :key="idx"
                    class="border-t hover:bg-gray-50"
                  >
                    <td class="px-4 py-3">
                      <img
                        v-if="item.image"
                        :src="item.image"
                        :alt="item.name"
                        class="w-10 h-10 object-cover rounded"
                      />
                      <div v-else class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <i class="pi pi-image text-gray-400 text-sm"></i>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="font-mono text-sm text-gray-600">{{ item.sku }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm font-medium text-gray-900">{{ item.name }}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="inline-flex items-center justify-center bg-gray-100 text-gray-800 font-bold rounded-full w-8 h-8 text-sm">
                        {{ item.quantity }}
                      </span>
                    </td>
                    <td v-if="showPrices && item.price !== undefined" class="px-4 py-3 text-right">
                      <span class="text-sm font-medium">{{ formatCurrency(item.price) }}</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="showPrices && order.total">
                  <tr class="border-t-2 bg-gray-50">
                    <td :colspan="3"></td>
                    <td class="px-4 py-3 text-right font-semibold text-sm text-gray-600">Total</td>
                    <td class="px-4 py-3 text-right font-bold text-lg">{{ formatCurrency(order.total) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Right column (1/3) -->
        <div class="space-y-6">
          <!-- Status change form -->
          <div class="bg-white rounded-lg shadow-sm border p-5">
            <h3 class="font-semibold text-gray-900 mb-4">Cambiar estado</h3>

            <div v-if="availableStates.length === 0" class="text-sm text-gray-500 text-center py-4">
              <i class="pi pi-check-circle text-green-500 text-2xl mb-2"></i>
              <p>No hay transiciones disponibles desde el estado actual.</p>
            </div>

            <div v-else class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Nuevo estado</label>
                <Dropdown
                  v-model="statusForm.state_id"
                  :options="availableStates"
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
                  rows="2"
                  class="w-full"
                  placeholder="Se incluirá en el email al cliente"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 block mb-1">Observación interna</label>
                <Textarea
                  v-model="statusForm.observacion_reparto"
                  rows="2"
                  class="w-full"
                  placeholder="Solo visible para tu equipo"
                />
              </div>

              <div class="flex items-center gap-2">
                <Checkbox
                  v-model="statusForm.notify_customer"
                  :binary="true"
                  inputId="notify_single"
                />
                <label for="notify_single" class="text-sm text-gray-700">Enviar email al cliente</label>
              </div>

              <Button
                label="Actualizar estado"
                icon="pi pi-check"
                class="w-full"
                @click="submitStatusChange"
                :loading="isChangingStatus"
                :disabled="!statusForm.state_id"
              />
            </div>
          </div>

          <!-- Timeline -->
          <div class="bg-white rounded-lg shadow-sm border p-5">
            <h3 class="font-semibold text-gray-900 mb-4">Historial de despacho</h3>

            <div v-if="order.timeline.length === 0" class="text-sm text-gray-500 text-center py-4">
              <i class="pi pi-history text-gray-300 text-2xl mb-2"></i>
              <p>Sin registros de despacho aún.</p>
            </div>

            <Timeline v-else :value="order.timeline" class="dispatch-timeline">
              <template #marker="{ item }">
                <span
                  class="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm"
                  :style="{ backgroundColor: getTimelineColor(item.state_id) }"
                >
                  <i :class="getTimelineIcon(item.state_id)"></i>
                </span>
              </template>
              <template #content="{ item }">
                <div class="mb-4">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-sm text-gray-900">{{ item.state_name }}</span>
                    <i
                      v-if="item.customer_notified"
                      class="pi pi-envelope text-xs text-primary"
                      v-tooltip.top="'Se notificó al cliente'"
                    ></i>
                  </div>
                  <p class="text-xs text-gray-500">
                    {{ formatDateTime(item.date) }}
                    <span v-if="item.user_name"> · {{ item.user_name }}</span>
                  </p>
                  <p v-if="item.comentario_cliente" class="text-xs text-gray-600 mt-1 bg-blue-50 p-2 rounded">
                    <i class="pi pi-comment text-xs mr-1"></i> {{ item.comentario_cliente }}
                  </p>
                  <p v-if="item.observacion_reparto" class="text-xs text-gray-500 mt-1 italic">
                    {{ item.observacion_reparto }}
                  </p>
                </div>
              </template>
            </Timeline>
          </div>

          <!-- Fulfillment provider info -->
          <div v-if="order.fulfillment_provider" class="bg-white rounded-lg shadow-sm border p-5">
            <h3 class="font-semibold text-gray-900 mb-2">Proveedor de fulfillment</h3>
            <div class="flex items-center gap-2">
              <i class="pi pi-warehouse text-primary"></i>
              <span class="text-sm font-medium">{{ order.fulfillment_provider }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div v-else-if="!isLoading" class="py-20 text-center">
      <i class="pi pi-exclamation-triangle text-4xl text-gray-300 mb-4"></i>
      <h2 class="text-lg font-semibold text-gray-700 mb-2">Pedido no encontrado</h2>
      <Button label="Volver a Despacho" icon="pi pi-arrow-left" text @click="goBack" />
    </div>
  </div>
</template>

<style scoped>
:deep(.dispatch-timeline .p-timeline-event-opposite) {
  display: none;
}
:deep(.dispatch-timeline .p-timeline-event-content) {
  padding-left: 0.75rem;
}
</style>
