<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import { useOrderDownloads, printableFromDispatch, type PrintableOrder } from '@/composables/useOrderDownloads'
import { useStoreInfoStore } from '@/stores/store-info.store'
import { useAuthStore } from '@/stores/auth.store'
import { dispatchApi } from '@/api/dispatch.api'
import apiClient from '@/api/axios'
import ShippingLabelDialog from '@/components/orders/ShippingLabelDialog.vue'
import type { DispatchOrderDetail, DispatchState, DispatchStateId } from '@/types/dispatch.types'
import type { SenderInfo } from '@/types/store.types'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Timeline from 'primevue/timeline'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { formatDate, formatDateTime, formatCurrency } = useFormatters()
const { downloadPickingList } = useOrderDownloads()
const storeInfoStore = useStoreInfoStore()
const authStore = useAuthStore()

const orderId = Number(route.params.id)

// ─── State ────────────────────────────────────────────────────
const order = ref<DispatchOrderDetail | null>(null)
const isLoading = ref(false)
const showPrices = ref(false)
const states = ref<DispatchState[]>([])
const senderInfo = ref<SenderInfo | undefined>(undefined)
const showLabelDialog = ref(false)
const labelPrintable = ref<PrintableOrder | null>(null)

const storeName = computed(() => authStore.selectedStore?.name || 'Mi Tienda')

// Status change form
const statusForm = ref({
  state_id: null as DispatchStateId | null,
  comentario_cliente: '',
  observacion_reparto: '',
  notify_customer: true
})
const isChangingStatus = ref(false)

// Olva manual dispatch
const isRedispatchingOlva = ref(false)
const OLVA_COURIER_ID = 9

const isOlvaOrder = computed(() => order.value?.courier_id === OLVA_COURIER_ID)
const olvaHasTracking = computed(() => !!order.value?.tracking.code)

// Cabify manual dispatch
const isRedispatchingCabify = ref(false)
const CABIFY_COURIER_ID = 10

const showCabifyRetryDialog = ref(false)
const cabifyRetryShippingType = ref('')

const isCabifyOrder = computed(() => order.value?.courier_id === CABIFY_COURIER_ID)
const cabifyHasTracking = computed(() => !!order.value?.tracking.code)
const cabifyTrackingUrl = computed(() => order.value?.tracking.url || null)

// Home Delivery manual dispatch
const isRedispatchingHD = ref(false)
const HOME_DELIVERY_COURIER_ID = 11

const isHomeDeliveryOrder = computed(() => order.value?.courier_id === HOME_DELIVERY_COURIER_ID)
const hdHasTracking = computed(() => !!order.value?.tracking.code)

// ─── Computed ─────────────────────────────────────────────────

const availableStates = computed(() => {
  if (!order.value) return []
  return order.value!.available_transitions
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

// Se muestra el envío aunque cueste 0 (envío gratis), pero no en retiros en
// tienda, donde nunca hubo despacho y la línea sería ruido.
const showShippingRow = computed(() => {
  const cost = order.value?.shipping_cost
  if (cost === null || cost === undefined) return false
  return cost > 0 || order.value?.delivery.type !== 'retiro'
})

/**
 * Datos de envío como texto plano, en el orden en que se rotula una caja.
 *
 * El almacén los selecciona y pega en Word para armar etiquetas cuando el
 * transportista pide un formato propio, así que el bloque se renderiza como
 * texto corrido y no como una grilla de cards: sombrear una grilla arrastra la
 * maquetación al pegarla.
 */
const shippingLines = computed(() => {
  const shipping = order.value?.shipping
  if (!shipping) return []

  const location = [shipping.district, shipping.province, shipping.department]
    .filter(Boolean).join(' - ')

  return [
    { label: 'Nombre', value: shipping.recipient_name },
    {
      label: 'Documento del destinatario',
      value: shipping.doc_number ? `${shipping.doc_type || 'DOC'} : ${shipping.doc_number}` : ''
    },
    { label: 'Teléfono', value: shipping.recipient_phone },
    {
      label: 'Dirección',
      value: [shipping.address, shipping.address_line2, location].filter(Boolean).join('\n')
    },
    { label: 'Referencia del envío', value: shipping.reference }
  ].filter(line => line.value)
})

const shippingAsText = computed(() =>
  ['DATOS DE ENVIO:', '', ...shippingLines.value.map(l => `${l.label}\n${l.value}\n`)].join('\n')
)

// ─── Methods ──────────────────────────────────────────────────

function copyShippingData() {
  navigator.clipboard.writeText(shippingAsText.value)
  toast.add({ severity: 'success', summary: 'Datos de envío copiados', life: 2000 })
}

function handleDownloadPickingList() {
  if (!order.value) return
  downloadPickingList(printableFromDispatch(order.value), storeName.value)
}

function handlePrintLabel() {
  if (!order.value) return
  labelPrintable.value = printableFromDispatch(order.value)
  showLabelDialog.value = true
}

async function loadSenderInfo() {
  try {
    const [, senderAddress] = await Promise.all([
      storeInfoStore.fetchInfo(),
      storeInfoStore.getSenderAddress()
    ])

    const info = storeInfoStore.info
    if (info) {
      senderInfo.value = {
        businessName: info.tienda_razonsocial || '',
        commercialName: info.tienda_nombre_comercial || '',
        ruc: info.tienda_ruc || '',
        phone: info.tienda_telefonocelular1 || info.tienda_telefonofijo1 || '',
        address: senderAddress?.tiendadireccion_direccion || '',
        district: senderAddress?.tiendadireccion_dist || '',
        province: senderAddress?.tiendadireccion_prov || '',
        department: senderAddress?.tiendadireccion_dpto || ''
      }
    }
  } catch (error) {
    // Sin remitente la etiqueta sigue siendo útil: pierde el bloque FROM, no el destino.
    console.error('Error loading sender info:', error)
    senderInfo.value = { businessName: storeName.value, commercialName: storeName.value, ruc: '', phone: '', address: '' }
  }
}

async function loadOrder() {
  isLoading.value = true
  try {
    const mode = showPrices.value ? undefined : 'picking'
    const response = await dispatchApi.getOrder(orderId, mode)
    if (response.success) {
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

async function redispatchOlva() {
  if (!confirm('¿Crear/reintentar el envío en Olva para esta orden?')) return

  isRedispatchingOlva.value = true
  try {
    const response = await dispatchApi.redispatchOlva(orderId)
    if (response.success && response.data?.tracking_code) {
      toast.add({
        severity: 'success',
        summary: 'Envío creado en Olva',
        detail: `Tracking: ${response.data.tracking_code}`,
        life: 4000
      })
      await loadOrder()
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Olva respondió sin tracking',
        detail: response.message || 'Revisá el log',
        life: 4000
      })
    }
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { message?: string; data?: { error?: string } } } })
      ?.response?.data
    const detail = data?.data?.error || data?.message || 'No se pudo crear el envío en Olva'
    toast.add({ severity: 'error', summary: 'Error', detail, life: 5000 })
  } finally {
    isRedispatchingOlva.value = false
  }
}

function openCabifyRetryDialog() {
  cabifyRetryShippingType.value = ''
  showCabifyRetryDialog.value = true
}

async function confirmCabifyRetry() {
  showCabifyRetryDialog.value = false
  await redispatchCabify(cabifyRetryShippingType.value.trim() || undefined)
}

/**
 * `shippingTypeId` solo se manda en el reintento manual: fuerza un tipo de
 * envío distinto al que resuelve la configuración de la tienda, que es la
 * salida cuando Cabify rechaza el envío por falta de cobertura en el destino.
 */
async function redispatchCabify(shippingTypeId?: string) {
  if (!shippingTypeId && !confirm('¿Crear/reintentar el envío en Cabify para esta orden?')) return

  isRedispatchingCabify.value = true
  try {
    const response = await dispatchApi.redispatchCabify(orderId, shippingTypeId)
    if (response.success && response.data?.tracking_code) {
      toast.add({
        severity: 'success',
        summary: 'Envío creado en Cabify',
        detail: `Tracking: ${response.data.tracking_code}`,
        life: 4000
      })
      await loadOrder()
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Cabify respondió sin tracking',
        detail: response.message || 'Revisá el log',
        life: 4000
      })
    }
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { message?: string; data?: { error?: string } } } })
      ?.response?.data
    const detail = data?.data?.error || data?.message || 'No se pudo crear el envío en Cabify'
    toast.add({ severity: 'error', summary: 'Error', detail, life: 5000 })
  } finally {
    isRedispatchingCabify.value = false
  }
}

function openCabifyTracking() {
  if (cabifyTrackingUrl.value) {
    window.open(cabifyTrackingUrl.value, '_blank', 'noopener')
  }
}

async function redispatchHomeDelivery() {
  if (!confirm('¿Crear/reintentar el pedido en Home Delivery para esta orden?')) return

  isRedispatchingHD.value = true
  try {
    const response = await dispatchApi.redispatchHomeDelivery(orderId)
    if (response.success && response.data?.tracking_code) {
      toast.add({
        severity: 'success',
        summary: 'Pedido creado en Home Delivery',
        detail: `Tracking: ${response.data.tracking_code}`,
        life: 4000
      })
      await loadOrder()
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Home Delivery respondió sin tracking',
        detail: response.message || 'Revisá el log',
        life: 4000
      })
    }
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { message?: string; data?: { error?: string } } } })
      ?.response?.data
    const detail = data?.data?.error || data?.message || 'No se pudo crear el pedido en Home Delivery'
    toast.add({ severity: 'error', summary: 'Error', detail, life: 5000 })
  } finally {
    isRedispatchingHD.value = false
  }
}

async function openHomeDeliveryLabel() {
  try {
    const response = await apiClient.get(`/orders/${orderId}/home-delivery-label`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const header = (response.headers as any)?.['content-disposition'] as string | undefined
    const match = header?.match(/filename="?([^"]+)"?/i)
    const filename = match?.[1] || `etiqueta-homedelivery-${orderId}.pdf`
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err: any) {
    let detail = 'No se pudo abrir la etiqueta de Home Delivery'
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        const parsed = JSON.parse(text)
        detail = parsed.messages?.error || parsed.message || detail
      } catch {
        // not JSON, keep default
      }
    } else {
      detail = err.response?.data?.messages?.error
        || err.response?.data?.message
        || detail
    }
    toast.add({ severity: 'error', summary: 'Error', detail, life: 5000 })
  }
}

async function openOlvaLabel() {
  try {
    const response = await apiClient.get(`/orders/${orderId}/olva-label`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const header = (response.headers as any)?.['content-disposition'] as string | undefined
    const match = header?.match(/filename="?([^"]+)"?/i)
    const filename = match?.[1] || `etiqueta-olva-${orderId}.pdf`
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err: any) {
    let detail = 'No se pudo abrir la etiqueta de Olva'
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        const parsed = JSON.parse(text)
        detail = parsed.messages?.error || parsed.message || detail
      } catch {
        // not JSON, keep default
      }
    } else {
      detail = err.response?.data?.messages?.error
        || err.response?.data?.message
        || detail
    }
    toast.add({ severity: 'error', summary: 'Error', detail, life: 5000 })
  }
}

function getStateBadgeClass(stateId: number): string {
  if (stateId === 30) return 'bg-primary/10 text-primary'
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
  loadSenderInfo()
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
        <div class="flex items-center gap-2">
          <!-- Picking y etiqueta: el despacho es donde se arma la caja, así que
               ambos documentos se imprimen desde acá sin pasar por Pedidos. -->
          <Button
            label="Picking List"
            icon="pi pi-box"
            severity="secondary"
            outlined
            size="small"
            @click="handleDownloadPickingList"
          />
          <Button
            v-if="order.delivery.type !== 'retiro'"
            label="Etiqueta"
            icon="pi pi-tag"
            severity="secondary"
            outlined
            size="small"
            @click="handlePrintLabel"
          />

          <!-- Olva: crear/reintentar envío -->
          <Button
            v-if="isOlvaOrder && !olvaHasTracking"
            label="Crear envío en Olva"
            icon="pi pi-send"
            severity="primary"
            size="small"
            :loading="isRedispatchingOlva"
            @click="redispatchOlva"
          />
          <Button
            v-else-if="isOlvaOrder"
            label="Reintentar envío"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            :loading="isRedispatchingOlva"
            @click="redispatchOlva"
          />

          <!-- Olva: imprimir etiqueta (solo cuando ya hay tracking) -->
          <Button
            v-if="isOlvaOrder && olvaHasTracking"
            label="Imprimir etiqueta"
            icon="pi pi-print"
            severity="secondary"
            size="small"
            @click="openOlvaLabel"
          />

          <!-- Cabify: crear/reintentar envío -->
          <Button
            v-if="isCabifyOrder && !cabifyHasTracking"
            label="Crear envío en Cabify"
            icon="pi pi-send"
            severity="primary"
            size="small"
            :loading="isRedispatchingCabify"
            @click="redispatchCabify()"
          />
          <Button
            v-else-if="isCabifyOrder"
            label="Reintentar envío"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            :loading="isRedispatchingCabify"
            @click="openCabifyRetryDialog"
          />

          <!-- Cabify: ver seguimiento (cuando ya hay tracking url) -->
          <Button
            v-if="isCabifyOrder && cabifyHasTracking && cabifyTrackingUrl"
            label="Ver seguimiento"
            icon="pi pi-map-marker"
            severity="secondary"
            size="small"
            @click="openCabifyTracking"
          />

          <!-- Home Delivery: crear/reintentar pedido -->
          <Button
            v-if="isHomeDeliveryOrder && !hdHasTracking"
            label="Crear envío en Home Delivery"
            icon="pi pi-send"
            severity="primary"
            size="small"
            :loading="isRedispatchingHD"
            @click="redispatchHomeDelivery"
          />
          <Button
            v-else-if="isHomeDeliveryOrder"
            label="Reintentar envío"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            :loading="isRedispatchingHD"
            @click="redispatchHomeDelivery"
          />

          <!-- Home Delivery: imprimir etiqueta (cuando ya hay tracking) -->
          <Button
            v-if="isHomeDeliveryOrder && hdHasTracking"
            label="Imprimir etiqueta"
            icon="pi pi-print"
            severity="secondary"
            size="small"
            @click="openHomeDeliveryLabel"
          />

          <Button
            label="Ver en Pedidos"
            icon="pi pi-external-link"
            severity="secondary"
            text
            size="small"
            @click="goToOrder"
          />
        </div>
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
                  <!-- Tarifa elegida por el comprador: define si el pedido sale hoy -->
                  <p v-if="order.delivery.service_type" class="text-sm text-gray-900 font-medium">
                    <i :class="['pi', order.delivery.service_type.icon || 'pi-truck', 'text-xs mr-1 text-primary']"></i>
                    {{ order.delivery.service_type.name }}
                  </p>
                  <p v-if="order.delivery.scheduled_date" class="text-sm text-gray-600">
                    <i class="pi pi-calendar text-xs mr-1"></i>
                    Programado: {{ formatDate(order.delivery.scheduled_date) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Datos de envío en bloque, listos para sombrear y pegar -->
            <div v-if="shippingLines.length" class="mt-4 pt-4 border-t">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Datos de envío</h3>
                <Button
                  label="Copiar"
                  icon="pi pi-copy"
                  text
                  size="small"
                  @click="copyShippingData"
                />
              </div>
              <div class="bg-gray-50 border rounded-lg p-4">
                <p class="font-semibold text-gray-900 mb-3">DATOS DE ENVIO:</p>
                <div v-for="line in shippingLines" :key="line.label" class="mb-3 last:mb-0">
                  <p class="text-sm text-gray-500">{{ line.label }}</p>
                  <p class="text-gray-900 whitespace-pre-line">{{ line.value }}</p>
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

            <!-- Prueba de entrega -->
            <div v-if="order.delivery_proof_url" class="mt-4 pt-4 border-t">
              <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Prueba de entrega</h3>
              <div class="flex items-start gap-3">
                <a :href="order.delivery_proof_url" target="_blank" class="block shrink-0">
                  <img
                    :src="order.delivery_proof_url"
                    alt="Foto de entrega"
                    class="w-24 h-24 object-cover rounded border hover:opacity-80 transition-opacity"
                  />
                </a>
                <a
                  :href="order.delivery_proof_url"
                  target="_blank"
                  class="text-primary text-sm hover:underline"
                >
                  <i class="pi pi-external-link text-xs mr-1"></i> Ver foto en tamaño completo
                </a>
              </div>
            </div>

            <!-- Observation -->
            <div v-if="order.observation" class="mt-4 pt-4 border-t">
              <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Nota del cliente</h3>
              <p class="text-sm text-gray-700 bg-amber-50 border border-amber-200 p-3 rounded-lg whitespace-pre-line">{{ order.observation }}</p>
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
                      <span class="font-mono text-sm text-gray-600">{{ item.variant_sku || item.sku }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-900">{{ item.name }}</span>
                        <span v-if="item.variant" class="text-xs text-gray-600 mt-0.5">{{ item.variant }}</span>
                      </div>
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
                  <tr v-if="showShippingRow" class="border-t bg-gray-50">
                    <td :colspan="3"></td>
                    <td class="px-4 py-2 text-right text-sm text-gray-600">
                      Envío<span v-if="order.delivery.service_type"> ({{ order.delivery.service_type.name }})</span>
                    </td>
                    <td class="px-4 py-2 text-right text-sm">
                      {{ (order.shipping_cost ?? 0) > 0 ? formatCurrency(order.shipping_cost ?? 0) : 'Gratis' }}
                    </td>
                  </tr>
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
                  :style="{ backgroundColor: getTimelineColor(item.state.id) }"
                >
                  <i :class="getTimelineIcon(item.state.id)"></i>
                </span>
              </template>
              <template #content="{ item }">
                <div class="mb-4">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-sm text-gray-900">{{ item.state.name }}</span>
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
                  <p v-if="item.comentario_cliente" class="text-xs text-gray-600 mt-1 bg-primary/5 p-2 rounded">
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

    <ShippingLabelDialog
      v-model:visible="showLabelDialog"
      :order="labelPrintable"
      :sender-info="senderInfo"
    />

    <Dialog
      v-model:visible="showCabifyRetryDialog"
      modal
      header="Reintentar envío en Cabify"
      :style="{ width: '30rem' }"
    >
      <p class="text-sm text-secondary-500 mb-4">
        Se volverá a crear el envío con la configuración de la tienda. Si Cabify lo rechazó
        por cobertura, puedes forzar otro tipo de envío solo para este pedido.
      </p>
      <label class="block text-sm font-medium text-secondary-700 mb-1">
        Tipo de envío (opcional)
      </label>
      <InputText
        v-model="cabifyRetryShippingType"
        class="w-full"
        placeholder="Déjalo vacío para usar el configurado"
      />
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="showCabifyRetryDialog = false" />
        <Button
          label="Reintentar"
          icon="pi pi-refresh"
          :loading="isRedispatchingCabify"
          @click="confirmCabifyRetry"
        />
      </template>
    </Dialog>
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
