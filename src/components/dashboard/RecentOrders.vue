<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Pedidos Recientes</h3>
        <router-link to="/orders" class="text-sm text-primary hover:underline">
          Ver todos
        </router-link>
      </div>
    </template>
    <template #content>
      <div v-if="orders.length === 0" class="text-center py-8 text-secondary-400">
        No hay pedidos recientes
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="order in orders"
          :key="order.id"
          class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          @click="goToOrder(order.id)"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-secondary">#{{ order.order_number }}</span>
              <span
                :class="[
                  'px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                  statusConfig(order.status).bgClass,
                  statusConfig(order.status).textClass
                ]"
              >
                <i :class="['pi', statusConfig(order.status).iconClass, 'text-xs']"></i>
                {{ statusConfig(order.status).label }}
              </span>
            </div>
            <p class="text-sm text-secondary-500">{{ order.customer.name }}</p>
            <p class="text-xs text-secondary-400">{{ formatDateTime(order.created_at) }}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-secondary">{{ formatCurrency(order.total) }}</p>
            <p class="text-xs text-secondary-400">{{ order.items.length }} item(s)</p>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import type { Order, OrderStatus } from '@/types/order.types'
import { useFormatters } from '@/composables/useFormatters'

interface Props {
  orders: Order[]
}

defineProps<Props>()

const router = useRouter()
const { formatCurrency, formatDateTime } = useFormatters()

// Solo estados de PAGO (no estados de envío)
// pending = 2 (pendiente), paid = 1 (confirmado), cancelled = 0 (rechazado)
const statusConfig = (status: OrderStatus) => {
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

  return configs[status] || configs.pending
}

const goToOrder = (id: number) => {
  router.push(`/orders/${id}`)
}
</script>
