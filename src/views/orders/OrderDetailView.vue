<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/orders.store'
import { useFormatters } from '@/composables/useFormatters'
import { useOrderDownloads } from '@/composables/useOrderDownloads'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import Timeline from 'primevue/timeline'
import Menu from 'primevue/menu'
import EmitDocumentDialog from '@/components/billing/EmitDocumentDialog.vue'
import DeliveryMap from '@/components/map/DeliveryMap.vue'
import FraudRiskCard from '@/components/fraud/FraudRiskCard.vue'
import apiClient from '@/api/axios'
import type { Order, OrderStatus } from '@/types/order.types'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()
const authStore = useAuthStore()
const toast = useToast()
const { formatCurrency, formatDate, formatTime, formatDateTime } = useFormatters()
const { downloadPDF, downloadTicket, downloadPickingList, downloadCSV } = useOrderDownloads()

const orderId = Number(route.params.id)
const showEmitDialog = ref(false)
const isSendingEmail = ref(false)
const isDebugLoading = ref(false)
const debugPaymentData = ref<any>(null)
const debugPaymentError = ref<string | null>(null)
const downloadMenu = ref()

// Store name for documents
const storeName = computed(() => authStore.selectedStore?.name || 'Mi Tienda')

// Download menu items
const downloadMenuItems = ref([
  {
    label: 'Descargar PDF',
    icon: 'pi pi-file-pdf',
    command: () => handleDownloadPDF()
  },
  {
    label: 'Descargar CSV',
    icon: 'pi pi-file-excel',
    command: () => handleDownloadCSV()
  },
  {
    separator: true
  },
  {
    label: 'Ticket (80mm)',
    icon: 'pi pi-receipt',
    command: () => handleDownloadTicket()
  },
  {
    label: 'Picking List',
    icon: 'pi pi-box',
    command: () => handleDownloadPickingList()
  }
])

// Download handlers
const handleDownloadPDF = () => {
  if (!order.value) return
  downloadPDF(order.value, storeName.value)
  toast.add({
    severity: 'success',
    summary: 'Descarga iniciada',
    detail: 'El PDF se está descargando',
    life: 2000
  })
}

const handleDownloadCSV = () => {
  if (!order.value) return
  downloadCSV(order.value)
  toast.add({
    severity: 'success',
    summary: 'Descarga iniciada',
    detail: 'El CSV se está descargando',
    life: 2000
  })
}

const handleDownloadTicket = () => {
  if (!order.value) return
  downloadTicket(order.value, storeName.value)
  toast.add({
    severity: 'success',
    summary: 'Descarga iniciada',
    detail: 'El ticket se está descargando',
    life: 2000
  })
}

const handleDownloadPickingList = () => {
  if (!order.value) return
  downloadPickingList(order.value, storeName.value)
  toast.add({
    severity: 'success',
    summary: 'Descarga iniciada',
    detail: 'El picking list se está descargando',
    life: 2000
  })
}

const toggleDownloadMenu = (event: Event) => {
  downloadMenu.value.toggle(event)
}

onMounted(async () => {
  console.log('🔍 [OrderDetailView] Cargando orden:', orderId)
  await ordersStore.fetchOrder(orderId)
  console.log('✅ [OrderDetailView] Orden cargada:', ordersStore.currentOrder)
})

const order = computed<Order | null>(() => {
  const currentOrder = ordersStore.currentOrder

  if (currentOrder) {
    console.log('📦 [OrderDetailView] Order computed:', {
      id: currentOrder.id,
      total: currentOrder.total,
      discount: currentOrder.discount,
      promotions: currentOrder.promotions,
      promotions_discount: currentOrder.promotions_discount,
      coupon_discount: currentOrder.coupon_discount,
      shipping_cost: currentOrder.shipping_cost
    })
  }

  return currentOrder
})

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

// Subtotal de productos + envío (antes de promociones a nivel de orden)
const subtotalAntesPromociones = computed(() => {
  if (!order.value?.items) return 0

  // Suma de productos con sus descuentos individuales + envío
  const productosTotal = order.value.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity
    const itemDiscount = getItemDiscount(item.id)
    return sum + (itemTotal - itemDiscount)
  }, 0)

  return productosTotal + (order.value?.shipping_cost || 0)
})

// Subtotal sin IGV - usar el total final de la orden (que ya incluye todos los descuentos)
const subtotalSinIGV = computed(() => {
  if (!order.value) return 0

  // El total de la orden ya tiene todos los descuentos aplicados (items + order-level)
  // Solo dividimos entre 1.18 para obtener el monto sin IGV
  const totalConIGV = roundingAmount.value !== 0 ? totalAfterRounding.value : order.value.total
  return totalConIGV / 1.18
})

// IGV (18%)
const igv = computed(() => {
  return subtotalSinIGV.value * 0.18
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

const totalPayments = computed(() => {
  if (!order.value?.payments || order.value.payments.length === 0) return 0
  return order.value.payments.reduce((sum, payment) => sum + parseFloat(payment.amount || '0'), 0)
})

// Get promotion for a specific order item
const getItemPromotion = (itemId: number) => {
  if (!order.value?.promotions) return null
  return order.value.promotions.find(promo => promo.order_item_id === itemId)
}

// Get discount for a specific order item
const getItemDiscount = (itemId: number): number => {
  const promotion = getItemPromotion(itemId)
  return promotion?.discount_amount || 0
}

// Check if item is bonificado (100% discount - free item from promotion like 2x1)
const isItemBonificado = (itemId: number): boolean => {
  const promotion = getItemPromotion(itemId)
  if (!promotion) return false

  // If discount equals the item price, it's bonificado
  const item = order.value?.items.find(i => i.id === itemId)
  if (!item) return false

  const itemTotal = item.price * item.quantity
  return promotion.discount_amount >= itemTotal
}

// Get order-level promotions (not linked to specific items)
const orderLevelPromotions = computed(() => {
  if (!order.value?.promotions) return []
  return order.value.promotions.filter(promo => !promo.order_item_id)
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

const netsuiteDocumentNumber = computed(() => {
  // Try erp_sync first (new clean field), then erpSyncData (parsed JSON)
  return order.value?.erp_sync?.netsuite_document_number
    || erpSyncData.value?.netsuite_document_number
    || null
})

const netsuiteInvoiceId = computed(() => {
  return order.value?.erp_sync?.netsuite_invoice_id
    || erpSyncData.value?.invoice_id
    || erpSyncData.value?.netsuite_invoice_id
    || null
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

const handleDebugPayments = async () => {
  if (!order.value) return

  try {
    isDebugLoading.value = true
    debugPaymentError.value = null
    debugPaymentData.value = null

    const response = await apiClient.get(`/debug/order-payments/${orderId}`)

    debugPaymentData.value = response.data
  } catch (error: any) {
    debugPaymentError.value = error.message || 'Error desconocido'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo consultar el estado de pagos',
      life: 5000
    })
  } finally {
    isDebugLoading.value = false
  }
}
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
        <!-- Download Menu -->
        <Button
          v-if="order"
          icon="pi pi-download"
          label="Descargar"
          severity="secondary"
          outlined
          @click="toggleDownloadMenu"
          aria-haspopup="true"
          aria-controls="download_menu"
        />
        <Menu
          ref="downloadMenu"
          id="download_menu"
          :model="downloadMenuItems"
          :popup="true"
        />

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
    <div v-else class="space-y-6">
      <!-- Fila 1: Facturación, Envío, Pago (3 columnas de igual ancho) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Facturación -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-file-edit text-primary"></i>
              Facturación
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div v-if="order.customer?.business_name">
                <p class="text-sm text-gray-500">Razón Social</p>
                <p class="font-semibold text-gray-900">{{ order.customer.business_name }}</p>
              </div>
              <div v-else>
                <p class="text-sm text-gray-500">Nombre</p>
                <p class="font-semibold text-gray-900">{{ order.customer?.name || 'N/A' }}</p>
              </div>
              <div v-if="order.customer?.document_type && order.customer?.document_number">
                <p class="text-sm text-gray-500">{{ order.customer.document_type }}</p>
                <p class="font-semibold text-gray-900">{{ order.customer.document_number }}</p>
              </div>
              <div v-if="order.customer?.email">
                <p class="text-sm text-gray-500">Email</p>
                <p class="font-semibold text-gray-900 break-words">{{ order.customer.email }}</p>
              </div>
              <div v-if="order.customer?.phone">
                <p class="text-sm text-gray-500">Teléfono</p>
                <p class="font-semibold text-gray-900">{{ order.customer.phone }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Envío -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-map-marker text-primary"></i>
              Envío
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div v-if="order.shipping_details?.recipient_name">
                <p class="text-sm text-gray-500">Destinatario</p>
                <p class="font-semibold text-gray-900">{{ order.shipping_details.recipient_name }}</p>
              </div>
              <div v-if="order.shipping_details?.recipient_phone">
                <p class="text-sm text-gray-500">Teléfono</p>
                <p class="font-semibold text-gray-900">{{ order.shipping_details.recipient_phone }}</p>
              </div>
              <div v-if="order.shipping_details?.address">
                <p class="text-sm text-gray-500">Dirección</p>
                <div class="space-y-1">
                  <p class="font-semibold text-gray-900">
                    {{ order.shipping_details.address }}{{ order.shipping_details.address_line2 ? ', ' + order.shipping_details.address_line2 : '' }}
                  </p>
                  <p class="text-gray-900 text-sm">
                    {{ [order.shipping_details.district, order.shipping_details.province, order.shipping_details.department, order.shipping_details.country].filter(Boolean).join(', ') }}{{ order.shipping_details.ubigeo_code ? ', ' + order.shipping_details.ubigeo_code : '' }}
                  </p>
                </div>
              </div>
              <div v-if="order.shipping_details?.date_delivered">
                <p class="text-sm text-gray-500">Fecha de entrega</p>
                <p class="text-gray-900">{{ formatDate(order.shipping_details.date_delivered) }}</p>
              </div>
              <div v-if="order.shipping_details?.courier">
                <p class="text-sm text-gray-500">Courier</p>
                <p class="text-gray-900">{{ order.shipping_details.courier }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Pago -->
        <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-credit-card text-primary"></i>
                Pago
              </div>
            </template>
            <template #content>
              <div class="space-y-3">
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
                      <div v-if="payment.payment_date" class="mt-1">
                        <p class="text-xs text-gray-500">
                          <i class="pi pi-calendar mr-1"></i>
                          {{ formatDateTime(payment.payment_date) }}
                        </p>
                      </div>
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

                  <!-- Total when multiple payments -->
                  <div v-if="order.payments.length > 1" class="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                    <p class="font-semibold text-gray-900">Total pagado:</p>
                    <p class="font-bold text-lg text-primary">{{ formatCurrency(totalPayments) }}</p>
                  </div>
                </div>

                <!-- Single payment (web sales) -->
                <div v-else-if="order.payment_method">
                  <p class="text-sm text-gray-500">Método de pago</p>
                  <p class="font-semibold text-gray-900 capitalize">{{ order.payment_method }}</p>
                </div>

                <div v-if="order.gateway_message">
                  <p class="text-sm text-gray-500">Mensaje de la pasarela</p>
                  <p class="text-gray-900">{{ order.gateway_message }}</p>
                </div>
              </div>
            </template>
          </Card>
      </div>

      <!-- Observaciones (ancho completo) -->
      <Card v-if="order.notes || order.store_notes">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-comment text-primary"></i>
            Observaciones
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-if="order.notes">
              <p class="text-sm text-gray-500 font-medium mb-2">Cliente</p>
              <p class="text-gray-900">{{ order.notes }}</p>
            </div>
            <div v-if="order.store_notes">
              <p class="text-sm text-gray-500 font-medium mb-2">Tienda (Interno)</p>
              <p class="text-gray-900 font-semibold">{{ order.store_notes }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Fila 2: Resumen/Mapa/Timeline y Análisis/Comprobante (2 columnas) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Columna izquierda (2/3 width) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Resumen del Pedido -->
            <Card>
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-shopping-cart text-primary"></i>
                  Resumen del Pedido
                </div>
              </template>
              <template #content>
                <!-- Productos - Tabla -->
                <div class="overflow-x-auto -mx-6">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-200 bg-gray-50">
                        <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                          Ítem
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                          Imagen
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th class="px-6 py-3 text-center text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                          Cant
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                          Precio Unit
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                          Dscto
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                          Valor Venta
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr
                        v-for="(item, index) in order.items"
                        :key="item.id"
                        class="hover:bg-gray-50"
                      >
                        <!-- Ítem -->
                        <td class="px-6 py-4 text-sm text-gray-700">
                          {{ index + 1 }}
                        </td>

                        <!-- Imagen -->
                        <td class="px-6 py-4">
                          <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <img
                              v-if="item.product_image"
                              :src="item.product_image"
                              :alt="item.product_name"
                              class="w-full h-full object-cover rounded-lg"
                            />
                            <i v-else class="pi pi-image text-xl text-gray-400"></i>
                          </div>
                        </td>

                        <!-- Descripción -->
                        <td class="px-6 py-4">
                          <div class="text-sm">
                            <p class="font-medium text-gray-900">
                              {{ item.product_name }}
                              <span v-if="isItemBonificado(item.id)" class="ml-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                                BONIFICADO
                              </span>
                              <span v-else-if="getItemPromotion(item.id)" class="ml-2 text-xs font-semibold text-green-700">
                                {{ getItemPromotion(item.id)?.discount_value }}% OFF
                              </span>
                            </p>
                            <p v-if="item.product_sku" class="text-xs text-gray-500 mt-0.5">
                              SKU: {{ item.product_sku }}
                            </p>
                          </div>
                        </td>

                        <!-- Cantidad -->
                        <td class="px-6 py-4 text-center text-sm text-gray-900">
                          {{ item.quantity }}
                        </td>

                        <!-- Precio Unitario -->
                        <td class="px-6 py-4 text-right text-sm">
                          <template v-if="item.original_price && item.original_price > item.price">
                            <div class="flex flex-col items-end">
                              <span class="text-gray-400 line-through text-xs">{{ formatCurrency(item.original_price) }}</span>
                              <span class="text-green-600 font-medium">{{ formatCurrency(item.price) }}</span>
                            </div>
                          </template>
                          <template v-else>
                            <span class="text-gray-900">{{ formatCurrency(item.price) }}</span>
                          </template>
                        </td>

                        <!-- Descuento -->
                        <td class="px-6 py-4 text-right text-sm whitespace-nowrap" :class="getItemDiscount(item.id) > 0 ? 'text-green-700 font-medium' : 'text-gray-400'">
                          <template v-if="isItemBonificado(item.id)">
                            <span>-{{ formatCurrency(item.price * item.quantity) }}</span>
                            <span class="block text-xs">(100%)</span>
                          </template>
                          <template v-else-if="getItemDiscount(item.id) > 0">
                            <span>-{{ formatCurrency(getItemDiscount(item.id)) }}</span>
                            <span v-if="getItemPromotion(item.id)?.discount_value" class="block text-xs text-green-600">({{ getItemPromotion(item.id)?.discount_value }}% OFF)</span>
                          </template>
                          <template v-else>
                            <span>—</span>
                          </template>
                        </td>

                        <!-- Valor Venta -->
                        <td class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          {{ formatCurrency((item.price * item.quantity) - getItemDiscount(item.id)) }}
                        </td>
                      </tr>

                      <!-- Servicio de Envío como ítem adicional -->
                      <tr v-if="order.shipping_cost && order.shipping_cost > 0" class="hover:bg-gray-50 border-t-2 border-gray-200">
                        <!-- Ítem -->
                        <td class="px-6 py-4 text-sm text-gray-700">
                          {{ order.items.length + 1 }}
                        </td>

                        <!-- Imagen -->
                        <td class="px-6 py-4">
                          <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="pi pi-truck text-xl text-primary"></i>
                          </div>
                        </td>

                        <!-- Descripción -->
                        <td class="px-6 py-4">
                          <div class="text-sm">
                            <p class="font-medium text-gray-900">Servicio de Envío</p>
                            <p v-if="order.shipping_details?.courier" class="text-xs text-gray-500 mt-0.5">
                              {{ order.shipping_details.courier }}
                            </p>
                          </div>
                        </td>

                        <!-- Cantidad -->
                        <td class="px-6 py-4 text-center text-sm text-gray-900">
                          1
                        </td>

                        <!-- Precio Unitario -->
                        <td class="px-6 py-4 text-right text-sm text-gray-900">
                          {{ formatCurrency(order.shipping_cost) }}
                        </td>

                        <!-- Descuento -->
                        <td class="px-6 py-4 text-right text-sm text-gray-400">
                          <span>—</span>
                        </td>

                        <!-- Valor Venta -->
                        <td class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          {{ formatCurrency(order.shipping_cost) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Totales - Tabla -->
                <div class="mt-6 overflow-x-auto -mx-6">
                  <table class="w-full">
                    <tbody class="divide-y divide-gray-100">
                      <!-- Subtotal antes de promociones de orden -->
                      <tr v-if="orderLevelPromotions.length > 0">
                        <td class="px-6 py-3 text-sm text-gray-700">
                          Subtotal:
                        </td>
                        <td class="px-6 py-3 text-sm text-right font-medium text-gray-900">
                          {{ formatCurrency(subtotalAntesPromociones) }}
                        </td>
                      </tr>

                      <!-- Promociones a nivel de orden (no vinculadas a productos específicos) -->
                      <template v-if="orderLevelPromotions.length > 0">
                        <tr class="bg-green-50">
                          <td colspan="2" class="px-6 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Promociones aplicadas:
                          </td>
                        </tr>
                        <tr
                          v-for="(promo, index) in orderLevelPromotions"
                          :key="index"
                          class="bg-green-50"
                        >
                          <td class="px-6 py-2 text-sm text-green-700">
                            <i class="pi pi-tag mr-1"></i>
                            {{ promo.name }}
                            <span v-if="promo.code" class="text-xs text-gray-500">({{ promo.code }})</span>
                          </td>
                          <td class="px-6 py-2 text-sm text-right font-medium text-green-700">
                            -{{ formatCurrency(promo.discount_amount) }}
                          </td>
                        </tr>
                      </template>

                      <!-- Descuento de cupón (si existe y es diferente de las promociones) -->
                      <tr v-if="order.coupon_discount && order.coupon_discount > 0" class="bg-green-50">
                        <td class="px-6 py-3 text-sm text-green-700">
                          <i class="pi pi-ticket mr-1"></i>
                          Cupón de descuento:
                        </td>
                        <td class="px-6 py-3 text-sm text-right font-medium text-green-700">
                          -{{ formatCurrency(order.coupon_discount) }}
                        </td>
                      </tr>

                      <!-- Descuento total (si no hay promociones detalladas) -->
                      <tr v-if="order.discount && order.discount > 0 && (!order.promotions || order.promotions.length === 0) && (!order.coupon_discount || order.coupon_discount === 0)" class="bg-green-50">
                        <td class="px-6 py-3 text-sm text-green-700">
                          Descuento:
                        </td>
                        <td class="px-6 py-3 text-sm text-right font-medium text-green-700">
                          -{{ formatCurrency(order.discount) }}
                        </td>
                      </tr>

                      <!-- Subtotal sin IGV -->
                      <tr class="border-t-2 border-gray-300">
                        <td class="px-6 py-3 text-sm text-gray-700">
                          Subtotal (sin IGV):
                        </td>
                        <td class="px-6 py-3 text-sm text-right font-medium text-gray-900">
                          {{ formatCurrency(subtotalSinIGV) }}
                        </td>
                      </tr>

                      <!-- IGV (18%) -->
                      <tr>
                        <td class="px-6 py-3 text-sm text-gray-700">
                          IGV (18%):
                        </td>
                        <td class="px-6 py-3 text-sm text-right font-medium text-gray-900">
                          {{ formatCurrency(igv) }}
                        </td>
                      </tr>

                      <!-- Redondeo (si existe) -->
                      <template v-if="roundingAmount !== 0">
                        <tr>
                          <td class="px-6 py-3 text-sm text-gray-700">
                            Redondeo:
                          </td>
                          <td class="px-6 py-3 text-sm text-right font-medium" :class="roundingAmount < 0 ? 'text-red-600' : 'text-green-600'">
                            {{ formatCurrency(roundingAmount) }}
                          </td>
                        </tr>
                      </template>

                      <!-- Total final -->
                      <tr class="border-t-2 border-gray-300 bg-gray-50">
                        <td class="px-6 py-4 text-lg font-bold text-gray-900">
                          Total a pagar:
                        </td>
                        <td class="px-6 py-4 text-lg text-right font-bold text-primary">
                          {{ formatCurrency(roundingAmount !== 0 ? totalAfterRounding : order.total) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </Card>

            <!-- Mapa de Ubicación -->
            <Card v-if="order.shipping_details?.latitude && order.shipping_details?.longitude">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-map text-primary"></i>
                  Mapa de Ubicación
                </div>
              </template>
              <template #content>
                <div class="space-y-3">
                  <DeliveryMap
                    :latitude="order.shipping_details.latitude"
                    :longitude="order.shipping_details.longitude"
                    :address="order.shipping_details.address"
                    height="300px"
                  />
                  <p class="text-gray-500 text-xs font-mono text-center">
                    {{ order.shipping_details.latitude }}, {{ order.shipping_details.longitude }}
                  </p>
                  <a
                    :href="`https://www.google.com/maps?q=${order.shipping_details.latitude},${order.shipping_details.longitude}`"
                    target="_blank"
                    class="text-primary hover:underline text-sm flex items-center justify-center gap-1"
                  >
                    <i class="pi pi-external-link"></i>
                    Ver en Google Maps
                  </a>
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
                  <!-- NetSuite Document Number (prominent) -->
                  <div v-if="netsuiteDocumentNumber" class="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-xs text-gray-500 mb-1">Documento NetSuite</p>
                        <p class="font-mono text-lg font-bold text-gray-900">{{ netsuiteDocumentNumber }}</p>
                      </div>
                      <div v-if="netsuiteInvoiceId" class="text-right">
                        <p class="text-xs text-gray-500 mb-1">Invoice ID</p>
                        <p class="font-mono text-sm text-gray-700">{{ netsuiteInvoiceId }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Invoice ID (when no document number yet) -->
                  <div v-else-if="netsuiteInvoiceId" class="flex items-center gap-3">
                    <div>
                      <p class="text-xs text-gray-500 mb-1">Invoice ID</p>
                      <p class="font-mono text-sm font-semibold text-gray-900">{{ netsuiteInvoiceId }}</p>
                    </div>
                  </div>

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

                  <!-- Debug Payment Status -->
                  <div class="mt-4 pt-4 border-t border-gray-200">
                    <div class="flex items-center justify-between mb-3">
                      <p class="text-sm text-gray-500">Verificar estado de pagos en NetSuite</p>
                      <Button
                        label="Consultar Pagos"
                        icon="pi pi-search"
                        severity="secondary"
                        size="small"
                        :loading="isDebugLoading"
                        @click="handleDebugPayments"
                      />
                    </div>

                    <!-- Debug Results -->
                    <div v-if="debugPaymentData" class="space-y-3">
                      <!-- Payment Status Summary -->
                      <div
                        class="p-3 rounded-lg border"
                        :class="debugPaymentData.netsuite?.amount_remaining === 0
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'"
                      >
                        <div class="flex items-center gap-2 mb-2">
                          <i
                            :class="[
                              'pi',
                              debugPaymentData.netsuite?.amount_remaining === 0
                                ? 'pi-check-circle text-green-600'
                                : 'pi-exclamation-circle text-yellow-600'
                            ]"
                          ></i>
                          <span class="font-semibold text-sm">
                            {{ debugPaymentData.netsuite?.amount_remaining === 0 ? 'Pagado completamente' : 'Pago pendiente' }}
                          </span>
                        </div>
                        <div class="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p class="text-gray-500 text-xs">Total Invoice</p>
                            <p class="font-mono font-semibold">{{ formatCurrency(debugPaymentData.netsuite?.total || 0) }}</p>
                          </div>
                          <div>
                            <p class="text-gray-500 text-xs">Pagado</p>
                            <p class="font-mono font-semibold text-green-700">{{ formatCurrency(debugPaymentData.netsuite?.amount_paid || 0) }}</p>
                          </div>
                          <div>
                            <p class="text-gray-500 text-xs">Pendiente</p>
                            <p
                              class="font-mono font-semibold"
                              :class="debugPaymentData.netsuite?.amount_remaining > 0 ? 'text-red-600' : 'text-gray-500'"
                            >
                              {{ formatCurrency(debugPaymentData.netsuite?.amount_remaining || 0) }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- Full Debug Response -->
                      <details class="text-sm">
                        <summary class="text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-2">
                          <i class="pi pi-code text-xs"></i>
                          Ver respuesta completa
                        </summary>
                        <pre class="mt-2 text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-64">{{ JSON.stringify(debugPaymentData, null, 2) }}</pre>
                      </details>
                    </div>

                    <!-- Debug Error -->
                    <div v-if="debugPaymentError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p class="text-sm text-red-800">{{ debugPaymentError }}</p>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <!-- Columna derecha (1/3 width) -->
          <div class="space-y-6">
            <!-- Análisis de Riesgo de Fraude -->
            <FraudRiskCard :order-id="orderId" />

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
