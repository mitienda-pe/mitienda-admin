<script setup lang="ts">
import { computed } from 'vue'
import type { Order, OrderStatus } from '@/types/order.types'
import { useFormatters } from '@/composables/useFormatters'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  (e: 'click', order: Order): void
}>()

const { formatCurrency, formatDate, formatTime } = useFormatters()

const statusConfig = computed(() => {
  const configs: Record<OrderStatus, { label: string; bgClass: string; textClass: string; iconClass: string }> = {
    pending: {
      label: 'Pendiente',
      bgClass: 'bg-yellow-100',
      textClass: 'text-yellow-800',
      iconClass: 'pi-clock'
    },
    processing: {
      label: 'Procesando',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-800',
      iconClass: 'pi-spin pi-spinner'
    },
    paid: {
      label: 'Pagado',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-800',
      iconClass: 'pi-check-circle'
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
    },
    cancelled: {
      label: 'Cancelado',
      bgClass: 'bg-red-100',
      textClass: 'text-red-800',
      iconClass: 'pi-times-circle'
    }
  }

  return configs[props.order.status]
})

const itemsCount = computed(() => {
  return props.order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
})

const handleClick = () => {
  emit('click', props.order)
}
</script>

<template>
  <div
    class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    @click="handleClick"
  >
    <!-- Header: Número y Estado -->
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-semibold text-gray-900">Pedido #{{ order.order_number }}</h3>
        <p class="text-sm text-gray-500">{{ order.customer?.name || 'Cliente' }}</p>
      </div>
      <span
        :class="[
          'px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1',
          statusConfig.bgClass,
          statusConfig.textClass
        ]"
      >
        <i :class="['pi', statusConfig.iconClass, 'text-xs']"></i>
        {{ statusConfig.label }}
      </span>
    </div>

    <!-- Fecha y Hora -->
    <div class="flex items-center gap-2 text-sm text-gray-600 mb-3">
      <i class="pi pi-calendar text-gray-400"></i>
      <span>{{ formatDate(order.created_at) }}</span>
      <span class="text-gray-400">•</span>
      <i class="pi pi-clock text-gray-400"></i>
      <span>{{ formatTime(order.created_at) }}</span>
    </div>

    <!-- Información de Items y Total -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-100">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <i class="pi pi-shopping-cart text-gray-400"></i>
        <span>{{ itemsCount }} {{ itemsCount === 1 ? 'item' : 'items' }}</span>
      </div>
      <div class="text-right">
        <p class="text-lg font-bold text-primary">{{ formatCurrency(order.total) }}</p>
      </div>
    </div>

    <!-- Método de Pago (opcional) -->
    <div v-if="order.payment_method" class="mt-2 flex items-center gap-2 text-xs text-gray-500">
      <i class="pi pi-credit-card"></i>
      <span class="capitalize">{{ order.payment_method }}</span>
    </div>
  </div>
</template>
