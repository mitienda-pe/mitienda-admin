<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/stores/orders.store'
import { useFormatters } from '@/composables/useFormatters'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Timeline from 'primevue/timeline'
import type { OrderStatus } from '@/types/order.types'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()
const { formatCurrency, formatDate, formatTime, formatDateTime } = useFormatters()

const orderId = Number(route.params.id)

onMounted(() => {
  ordersStore.fetchOrder(orderId)
})

const order = computed(() => ordersStore.currentOrder)

const statusConfig = computed(() => {
  if (!order.value) return null

  const configs: Record<OrderStatus, { label: string; severity: 'warning' | 'info' | 'secondary' | 'success' | 'danger'; icon: string }> = {
    pending: {
      label: 'Pendiente',
      severity: 'warning',
      icon: 'pi-clock'
    },
    processing: {
      label: 'Procesando',
      severity: 'info',
      icon: 'pi-spin pi-spinner'
    },
    paid: {
      label: 'Pagado',
      severity: 'info',
      icon: 'pi-check-circle'
    },
    shipped: {
      label: 'Enviado',
      severity: 'secondary',
      icon: 'pi-truck'
    },
    delivered: {
      label: 'Entregado',
      severity: 'success',
      icon: 'pi-check'
    },
    cancelled: {
      label: 'Cancelado',
      severity: 'danger',
      icon: 'pi-times-circle'
    }
  }

  return configs[order.value.status]
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

const goBack = () => {
  router.push('/orders')
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
      <Tag
        v-if="statusConfig"
        :value="statusConfig.label"
        :severity="statusConfig.severity"
        :icon="'pi ' + statusConfig.icon"
      />
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
              <div class="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
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
            </div>
          </template>
        </Card>

        <!-- Información de Envío -->
        <Card v-if="order.shipping_address">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-map-marker text-primary"></i>
              Dirección de Envío
            </div>
          </template>
          <template #content>
            <p class="text-gray-900 whitespace-pre-line">{{ order.shipping_address }}</p>
          </template>
        </Card>

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
              <div v-if="order.payment_method">
                <p class="text-sm text-gray-500">Método de pago</p>
                <p class="font-semibold text-gray-900 capitalize">{{ order.payment_method }}</p>
              </div>
              <div v-if="order.notes">
                <p class="text-sm text-gray-500">Notas</p>
                <p class="text-gray-900">{{ order.notes }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
