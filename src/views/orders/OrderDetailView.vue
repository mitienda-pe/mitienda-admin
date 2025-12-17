<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/orders.store'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import Timeline from 'primevue/timeline'
import EmitDocumentDialog from '@/components/billing/EmitDocumentDialog.vue'
import DeliveryMap from '@/components/map/DeliveryMap.vue'
import FraudRiskCard from '@/components/fraud/FraudRiskCard.vue'
import type { Order, OrderStatus } from '@/types/order.types'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()
const toast = useToast()
const { formatCurrency, formatDate, formatTime, formatDateTime } = useFormatters()

const orderId = Number(route.params.id)
const showEmitDialog = ref(false)
const isSendingEmail = ref(false)

onMounted(() => {
  ordersStore.fetchOrder(orderId)
})

const order = computed<Order | null>(() => ordersStore.currentOrder)

// Solo estados de PAGO (no estados de envío)
// pending = 2 (pendiente), paid = 1 (confirmado), cancelled = 0 (rechazado)
const statusConfig = computed(() => {
  if (!order.value) return null

  const configs: Record<OrderStatus, { label: string; bgClass: string; textClass: string; iconClass: string }> = {
    pending: {
      label: 'Pendiente',
      bgClass: 'bg-yellow-100',
      textClass: 'text-yellow-800',
      iconClass: 'pi-clock'
    },
    paid: {
      label: 'Pagado',
      bgClass: 'bg-green-100',
      textClass: 'text-green-800',
      iconClass: 'pi-check-circle'
    },
    cancelled: {
      label: 'Rechazado',
      bgClass: 'bg-red-100',
      textClass: 'text-red-800',
      iconClass: 'pi-times-circle'
    },
    // Fallbacks (no deberían usarse con el backend actual)
    processing: {
      label: 'Procesando',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-800',
      iconClass: 'pi-spin pi-spinner'
    },
    shipped: {
      label: 'Enviado',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-800',
      iconClass: 'pi-truck'
    },
    delivered: {
      label: 'Entregado',
      bgClass: 'bg-green-100',
      textClass: 'text-green-800',
      iconClass: 'pi-check'
    }
  }

  return configs[order.value.status] || configs.pending
})

const timelineEvents = computed(() => {
  if (!order.value) return []

  const events: Array<{
    status: string
    date: string
    icon: string
    color: string
  }> = []

  // Siempre hay un evento de creación
  events.push({
    status: 'Pedido creado',
    date: formatDateTime(order.value.created_at),
    icon: 'pi pi-shopping-cart',
    color: '#9C27B0'
  })

  // Eventos según el estado actual
  if (order.value.status === 'paid' || order.value.status === 'shipped' || order.value.status === 'delivered') {
    events.push({
      status: 'Pago confirmado',
      date: formatDateTime(order.value.updated_at),
      icon: 'pi pi-check-circle',
      color: '#2196F3'
    })
  }

  if (order.value.status === 'shipped' || order.value.status === 'delivered') {
    events.push({
      status: 'Pedido enviado',
      date: formatDateTime(order.value.updated_at),
      icon: 'pi pi-truck',
      color: '#FF9800'
    })
  }

  if (order.value.status === 'delivered') {
    events.push({
      status: 'Pedido entregado',
      date: formatDateTime(order.value.updated_at),
      icon: 'pi pi-check',
      color: '#4CAF50'
    })
  }

  if (order.value.status === 'cancelled') {
    events.push({
      status: 'Pedido cancelado',
      date: formatDateTime(order.value.updated_at),
      icon: 'pi pi-times-circle',
      color: '#F44336'
    })
  }

  return events
})

const subtotal = computed(() => {
  if (!order.value?.items) return 0
  return order.value.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const roundingAmount = computed(() => {
  if (!order.value) return 0

  // Buscar rounding_amount en el objeto order
  if (order.value.rounding_amount !== undefined && order.value.rounding_amount !== null) {
    return order.value.rounding_amount
  }

  return 0
})

const totalAfterRounding = computed(() => {
  if (!order.value) return 0

  // Si existe total_after_rounding, usarlo directamente
  if (order.value.total_after_rounding !== undefined && order.value.total_after_rounding !== null) {
    return order.value.total_after_rounding
  }

  // Si hay redondeo pero no total_after_rounding, calcularlo
  const rounding = roundingAmount.value
  if (rounding !== 0) {
    return order.value.total + rounding
  }

  // Si no hay redondeo, devolver el total normal
  return order.value.total
})

const goBack = () => {
  router.push('/orders')
}

const handleEmitSuccess = () => {
  toast.add({
    severity: 'success',
    summary: 'Comprobante Emitido',
    detail: 'El comprobante se ha emitido exitosamente',
    life: 3000
  })
  // Optionally refresh the order to show updated billing status
  ordersStore.fetchOrder(orderId)
}

const hasEmittedDocument = computed(() => {
  // Check if order has an emitted billing document
  return order.value?.billing_document && order.value.billing_document.status === 1
})

const canEmitDocument = computed(() => {
  // Can emit if order exists, is paid, has customer info, and NO document emitted yet
  return order.value &&
         order.value.status === 'paid' &&
         order.value.customer &&
         !hasEmittedDocument.value
})

const canSendEmail = computed(() => {
  // Can send email if order is paid and has a valid customer email
  return order.value &&
         order.value.status === 'paid' &&
         order.value.customer?.email &&
         order.value.customer.email.includes('@')
})

const erpSyncData = computed(() => {
  if (!order.value?.tiendaventa_mensaje_notif_erp) return null

  try {
    const parsed = JSON.parse(order.value.tiendaventa_mensaje_notif_erp)
    return parsed
  } catch (e) {
    console.error('Error parsing ERP message:', e)
    return null
  }
})

const erpPayloadData = computed(() => {
  const orderData = order.value as any
  if (!orderData?.tiendaventa_payload_notif_erp) return null

  try {
    const parsed = JSON.parse(orderData.tiendaventa_payload_notif_erp)
    return parsed
  } catch (e) {
    console.error('Error parsing ERP payload:', e)
    return null
  }
})

const erpSyncStatus = computed(() => {
  if (!order.value) return null

  // tiendaventa_estado_notif_erp: 0 = success, 1 = error
  const status = order.value.tiendaventa_estado_notif_erp

  if (status === 0) {
    return {
      label: 'Exitoso',
      severity: 'success',
      icon: 'pi-check-circle',
      bgClass: 'bg-green-100',
      textClass: 'text-green-800'
    }
  } else if (status === 1) {
    return {
      label: 'Error',
      severity: 'danger',
      icon: 'pi-times-circle',
      bgClass: 'bg-red-100',
      textClass: 'text-red-800'
    }
  }

  return null
})

const erpPaymentIds = computed(() => {
  if (!erpSyncData.value || !erpSyncData.value.payment_ids) return []
  return erpSyncData.value.payment_ids
})

const handleSendInvoiceEmail = async () => {
  if (!order.value) return

  try {
    isSendingEmail.value = true
    await ordersStore.resendInvoiceEmail(orderId)

    toast.add({
      severity: 'success',
      summary: 'Email Enviado',
      detail: `Se ha enviado la factura a ${order.value.customer.email}`,
      life: 3000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error al Enviar',
      detail: error.response?.data?.message || 'No se pudo enviar el email',
      life: 5000
    })
  } finally {
    isSendingEmail.value = false
  }
}

const downloadDocument = (url: string, _filename: string) => {
  if (!url) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'URL de descarga no disponible',
      life: 3000
    })
    return
  }

  // Open in new tab
  window.open(url, '_blank')
}

const billingDocumentNumber = computed(() => {
  if (!order.value?.billing_document) return ''
  const { serie, correlative } = order.value.billing_document
  return `${serie}-${correlative}`
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          @click="goBack"
        />
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Pedido #{{ order?.order_number }}
          </h1>
          <p v-if="order" class="text-gray-600 mt-1">
            {{ formatDate(order.created_at) }} a las {{ formatTime(order.created_at) }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Button
          v-if="canSendEmail"
          label="Enviar Email"
          icon="pi pi-envelope"
          severity="info"
          :loading="isSendingEmail"
          @click="handleSendInvoiceEmail"
          v-tooltip.left="'Enviar factura por email al cliente'"
        />
        <Button
          v-if="canEmitDocument"
          label="Emitir Comprobante"
          icon="pi pi-file-pdf"
          severity="success"
          @click="showEmitDialog = true"
        />
        <span
          v-if="statusConfig"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2',
            statusConfig.bgClass,
            statusConfig.textClass
          ]"
        >
          <i :class="['pi', statusConfig.iconClass]"></i>
          {{ statusConfig.label }}
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="ordersStore.isLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="ordersStore.error"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
      <p class="text-red-700">{{ ordersStore.error }}</p>
      <Button
        label="Volver a pedidos"
        icon="pi pi-arrow-left"
        class="mt-4"
        @click="goBack"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!order"
      class="bg-white border border-gray-200 rounded-lg p-12 text-center"
    >
      <i class="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Pedido no encontrado</h3>
      <p class="text-gray-600 mb-4">El pedido que buscas no existe o ha sido eliminado</p>
      <Button
        label="Volver a pedidos"
        icon="pi pi-arrow-left"
        @click="goBack"
      />
    </div>

    <!-- Contenido del Pedido -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna Principal -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Productos -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-box text-primary"></i>
              Productos
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
              >
                <!-- Imagen del producto -->
                <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img
                    v-if="item.product_image"
                    :src="item.product_image"
                    :alt="item.product_name"
                    class="w-full h-full object-cover rounded-lg"
                  />
                  <i v-else class="pi pi-image text-2xl text-gray-400"></i>
                </div>

                <!-- Información del producto -->
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900">{{ item.product_name }}</h4>
                  <p v-if="item.product_sku" class="text-sm text-gray-500">
                    SKU: {{ item.product_sku }}
                  </p>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ formatCurrency(item.price) }} × {{ item.quantity }}
                  </p>
                </div>

                <!-- Subtotal del item -->
                <div class="text-right">
                  <p class="font-semibold text-gray-900">
                    {{ formatCurrency(item.price * item.quantity) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Totales -->
            <div class="mt-6 pt-6 border-t border-gray-200 space-y-2">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{{ formatCurrency(subtotal) }}</span>
              </div>
              <div v-if="order.shipping_cost" class="flex justify-between text-gray-600">
                <span>Envío:</span>
                <span>{{ formatCurrency(order.shipping_cost) }}</span>
              </div>
              <div v-if="order.discount" class="flex justify-between text-green-600">
                <span>Descuento:</span>
                <span>-{{ formatCurrency(order.discount) }}</span>
              </div>

              <!-- Mostrar redondeo si existe -->
              <template v-if="roundingAmount !== 0">
                <div class="flex justify-between text-gray-600 pt-2 border-t">
                  <span>Subtotal antes de redondeo:</span>
                  <span>{{ formatCurrency(order.total) }}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>Redondeo:</span>
                  <span :class="roundingAmount < 0 ? 'text-red-600' : 'text-green-600'">
                    {{ formatCurrency(roundingAmount) }}
                  </span>
                </div>
                <div class="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Total:</span>
                  <span class="text-primary">{{ formatCurrency(totalAfterRounding) }}</span>
                </div>
              </template>

              <!-- Si no hay redondeo, mostrar total normal -->
              <div v-else class="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Total:</span>
                <span class="text-primary">{{ formatCurrency(order.total) }}</span>
              </div>
            </div>
          </template>
        </Card>

        <!-- Timeline del Pedido -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-history text-primary"></i>
              Historial
            </div>
          </template>
          <template #content>
            <Timeline :value="timelineEvents" align="left">
              <template #marker="slotProps">
                <span
                  class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10"
                  :style="{ backgroundColor: slotProps.item.color }"
                >
                  <i :class="slotProps.item.icon"></i>
                </span>
              </template>
              <template #content="slotProps">
                <div>
                  <p class="font-semibold text-gray-900">{{ slotProps.item.status }}</p>
                  <p class="text-sm text-gray-500">{{ slotProps.item.date }}</p>
                </div>
              </template>
            </Timeline>
          </template>
        </Card>

        <!-- Sincronización ERP -->
        <Card v-if="erpSyncData || order.tiendaventa_mensaje_notif_erp">
          <template #title>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <i class="pi pi-sync text-primary"></i>
                Sincronización ERP
              </div>
              <span
                v-if="erpSyncStatus"
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5',
                  erpSyncStatus.bgClass,
                  erpSyncStatus.textClass
                ]"
              >
                <i :class="['pi', erpSyncStatus.icon]"></i>
                {{ erpSyncStatus.label }}
              </span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Success/Error Status -->
              <div v-if="erpSyncData">
                <div v-if="!erpSyncData.success && erpSyncData.error" class="mb-3">
                  <p class="text-sm text-gray-500 mb-1">Error</p>
                  <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p class="text-sm text-red-800">{{ erpSyncData.error }}</p>
                  </div>
                </div>

                <!-- Steps Timeline -->
                <div v-if="erpSyncData.steps && erpSyncData.steps.length > 0">
                  <p class="text-sm text-gray-500 mb-2">Pasos de sincronización</p>
                  <div class="space-y-2">
                    <div
                      v-for="(step, index) in erpSyncData.steps"
                      :key="index"
                      class="flex items-start gap-2 text-sm"
                    >
                      <i
                        :class="[
                          'pi mt-0.5',
                          step.status === 'success' ? 'pi-check-circle text-green-600' : 'pi-times-circle text-red-600'
                        ]"
                      ></i>
                      <div class="flex-1">
                        <p class="font-medium text-gray-900">{{ step.step }}</p>
                        <p v-if="step.action" class="text-gray-600 text-xs">Acción: {{ step.action }}</p>
                        <p v-if="step.customer_id" class="text-gray-600 text-xs">Customer ID: {{ step.customer_id }}</p>
                        <p v-if="step.message" class="text-gray-600 text-xs">{{ step.message }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Failed At -->
                <div v-if="erpSyncData.failed_at" class="mt-3">
                  <p class="text-sm text-gray-500">Fecha de error</p>
                  <p class="text-gray-900 text-sm">{{ erpSyncData.failed_at }}</p>
                </div>

                <!-- Success Data (if applicable) -->
                <div v-if="erpSyncData.success && erpSyncData.invoice_id">
                  <p class="text-sm text-gray-500">Invoice ID</p>
                  <p class="font-mono text-sm text-gray-900">{{ erpSyncData.invoice_id }}</p>
                </div>

                <!-- Payment IDs / Transactions -->
                <div v-if="erpPaymentIds.length > 0" class="mt-4">
                  <p class="text-sm text-gray-500 mb-2">Transacciones en NetSuite</p>
                  <div class="space-y-2">
                    <div
                      v-for="(payment, index) in erpPaymentIds"
                      :key="index"
                      class="flex items-start justify-between p-3 rounded-lg border"
                      :class="payment.type === 'journal_entry' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'"
                    >
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <p class="font-semibold text-gray-900 text-sm">
                            <span v-if="payment.type === 'journal_entry'">
                              <i class="pi pi-book text-orange-600 mr-1"></i>
                              Asiento Contable
                            </span>
                            <span v-else>
                              <i class="pi pi-credit-card text-blue-600 mr-1"></i>
                              Pago Cliente
                            </span>
                          </p>
                        </div>
                        <p class="text-xs text-gray-600 mt-1">
                          ID: <span class="font-mono">{{ payment.payment_id }}</span>
                        </p>
                        <p class="text-xs text-gray-600">
                          <span v-if="payment.type === 'journal_entry'" class="text-orange-700 font-medium">
                            Redondeo a favor
                          </span>
                          <span v-else class="capitalize">
                            {{ payment.method === 'efectivo' ? 'Efectivo' : payment.method === 'card' ? 'Tarjeta' : payment.method }}
                          </span>
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-sm" :class="payment.type === 'journal_entry' ? 'text-orange-700' : 'text-gray-900'">
                          {{ formatCurrency(payment.amount) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Request Payload (collapsible) -->
              <details v-if="erpPayloadData" class="mt-3">
                <summary class="text-sm text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-2">
                  <i class="pi pi-arrow-up text-xs"></i>
                  Ver Payload Enviado a NetSuite
                </summary>
                <pre class="mt-2 text-xs bg-blue-50 border border-blue-200 rounded p-3 overflow-auto max-h-96">{{ JSON.stringify(erpPayloadData, null, 2) }}</pre>
              </details>

              <!-- Response JSON (always visible) -->
              <div class="mt-3">
                <p class="text-sm text-gray-500 mb-2">Respuesta de NetSuite</p>
                <pre class="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-96">{{ JSON.stringify(erpSyncData || order.tiendaventa_mensaje_notif_erp, null, 2) }}</pre>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sidebar: Información del Cliente y Pedido -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Información del Cliente -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-primary"></i>
              Cliente
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-500">Nombre</p>
                <p class="font-semibold text-gray-900">{{ order.customer?.name || 'N/A' }}</p>
              </div>
              <div v-if="order.customer?.email">
                <p class="text-sm text-gray-500">Email</p>
                <p class="font-semibold text-gray-900">{{ order.customer.email }}</p>
              </div>
              <div v-if="order.customer?.phone">
                <p class="text-sm text-gray-500">Teléfono</p>
                <p class="font-semibold text-gray-900">{{ order.customer.phone }}</p>
              </div>
              <div v-if="order.customer?.document_type && order.customer?.document_number">
                <p class="text-sm text-gray-500">Documento</p>
                <p class="font-semibold text-gray-900">
                  {{ order.customer.document_type }} {{ order.customer.document_number }}
                </p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Información de Envío -->
        <Card v-if="order.shipping_details">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-map-marker text-primary"></i>
              Dirección de Envío
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div v-if="order.shipping_details.address">
                <p class="text-sm text-gray-500">Dirección</p>
                <p class="font-semibold text-gray-900">{{ order.shipping_details.address }}</p>
                <p v-if="order.shipping_details.address_line2" class="text-gray-700 text-sm">
                  {{ order.shipping_details.address_line2 }}
                </p>
              </div>
              <div v-if="order.shipping_details.district || order.shipping_details.city">
                <p class="text-sm text-gray-500">Ubicación</p>
                <p class="text-gray-900">
                  {{ [order.shipping_details.district, order.shipping_details.city, order.shipping_details.state].filter(Boolean).join(', ') }}
                </p>
              </div>
              <div v-if="order.shipping_details.reference">
                <p class="text-sm text-gray-500">Referencia</p>
                <p class="text-gray-900">{{ order.shipping_details.reference }}</p>
              </div>
              <!-- Mapa de ubicación -->
              <div v-if="order.shipping_details.latitude && order.shipping_details.longitude" class="pt-3">
                <p class="text-sm text-gray-500 mb-2">Ubicación de entrega</p>
                <DeliveryMap
                  :latitude="order.shipping_details.latitude"
                  :longitude="order.shipping_details.longitude"
                  :address="order.shipping_details.address"
                  height="250px"
                />
                <p class="text-gray-500 text-xs font-mono mt-2 text-center">
                  {{ order.shipping_details.latitude }}, {{ order.shipping_details.longitude }}
                </p>
                <a
                  :href="`https://www.google.com/maps?q=${order.shipping_details.latitude},${order.shipping_details.longitude}`"
                  target="_blank"
                  class="text-primary hover:underline text-xs flex items-center justify-center gap-1 mt-1"
                >
                  <i class="pi pi-external-link"></i>
                  Ver en Google Maps
                </a>
              </div>
              <div v-if="order.shipping_details.cost">
                <p class="text-sm text-gray-500">Costo de envío</p>
                <p class="font-semibold text-gray-900">{{ formatCurrency(parseFloat(order.shipping_details.cost)) }}</p>
              </div>
              <div v-if="order.shipping_details.courier">
                <p class="text-sm text-gray-500">Courier</p>
                <p class="text-gray-900">{{ order.shipping_details.courier }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Análisis de Riesgo de Fraude -->
        <FraudRiskCard :order-id="orderId" />

        <!-- Información de Pago -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-credit-card text-primary"></i>
              Pago
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div v-if="order.payment_gateway">
                <p class="text-sm text-gray-500">Pasarela de pago</p>
                <p class="font-semibold text-gray-900">{{ order.payment_gateway }}</p>
              </div>

              <!-- POS payments (one or more) -->
              <div v-if="order.payments && order.payments.length > 0" class="space-y-2">
                <p class="text-sm text-gray-500 font-medium">{{ order.payments.length > 1 ? 'Métodos de pago utilizados' : 'Método de pago' }}</p>
                <div
                  v-for="(payment, index) in order.payments"
                  :key="index"
                  class="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div class="flex-1">
                    <p class="font-semibold text-gray-900">{{ payment.method_name }}</p>
                    <div v-if="payment.authorization_number" class="mt-1">
                      <p class="text-xs text-gray-500">
                        <i class="pi pi-check-circle mr-1"></i>
                        Autorización: <span class="font-mono">{{ payment.authorization_number }}</span>
                      </p>
                    </div>
                    <div v-if="payment.reference && !payment.authorization_number" class="mt-1">
                      <p class="text-xs text-gray-500">
                        Ref: {{ payment.reference }}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-gray-900">{{ formatCurrency(parseFloat(payment.amount)) }}</p>
                  </div>
                </div>
              </div>

              <!-- Single payment (web sales) -->
              <div v-else-if="order.payment_method">
                <p class="text-sm text-gray-500">Método de pago</p>
                <p class="font-semibold text-gray-900 capitalize">{{ order.payment_method }}</p>
              </div>

              <div v-if="order.gateway_code">
                <p class="text-sm text-gray-500">Código de la pasarela</p>
                <p class="font-mono text-sm text-gray-900">{{ order.gateway_code }}</p>
              </div>
              <div v-if="order.gateway_message">
                <p class="text-sm text-gray-500">Mensaje de la pasarela</p>
                <p class="text-gray-900">{{ order.gateway_message }}</p>
              </div>
              <div v-if="order.notes">
                <p class="text-sm text-gray-500">Notas</p>
                <p class="text-gray-900">{{ order.notes }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Comprobante Emitido -->
        <Card v-if="hasEmittedDocument">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-file-pdf text-primary"></i>
              Comprobante Emitido
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-500">Número de comprobante</p>
                <p class="font-semibold text-gray-900 font-mono">{{ billingDocumentNumber }}</p>
              </div>
              <div v-if="order.billing_document?.billing_date">
                <p class="text-sm text-gray-500">Fecha de emisión</p>
                <p class="text-gray-900">{{ formatDate(order.billing_document.billing_date) }}</p>
              </div>

              <!-- Download Buttons -->
              <div class="flex flex-col gap-2 pt-2">
                <Button
                  v-if="order.billing_document?.pdf_url"
                  label="Descargar PDF"
                  icon="pi pi-file-pdf"
                  severity="danger"
                  outlined
                  size="small"
                  class="w-full"
                  @click="downloadDocument(order.billing_document.pdf_url!, 'comprobante.pdf')"
                />
                <Button
                  v-if="order.billing_document?.xml_url"
                  label="Descargar XML"
                  icon="pi pi-file"
                  severity="info"
                  outlined
                  size="small"
                  class="w-full"
                  @click="downloadDocument(order.billing_document.xml_url!, 'comprobante.xml')"
                />
                <Button
                  v-if="!order.billing_document?.pdf_url && !order.billing_document?.xml_url"
                  label="Ver Comprobante"
                  icon="pi pi-eye"
                  severity="secondary"
                  outlined
                  size="small"
                  class="w-full"
                  @click="$router.push(`/billing/documents/${order.billing_document?.id}`)"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Emit Document Dialog -->
    <EmitDocumentDialog
      v-if="order"
      v-model:visible="showEmitDialog"
      :order-id="order.id"
      :order-number="order.order_number"
      :order-total="order.total"
      @success="handleEmitSuccess"
    />
  </div>
</template>
