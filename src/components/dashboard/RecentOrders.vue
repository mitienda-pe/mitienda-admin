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
              <Tag :value="getStatusLabel(order.status)" :severity="getStatusSeverity(order.status)" />
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
import Tag from 'primevue/tag'
import type { Order, OrderStatus } from '@/types/order.types'
import { useFormatters } from '@/composables/useFormatters'

interface Props {
  orders: Order[]
}

defineProps<Props>()

const router = useRouter()
const { formatCurrency, formatDateTime } = useFormatters()

const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    processing: 'En proceso',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  }
  return labels[status]
}

const getStatusSeverity = (status: OrderStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' => {
  const severities: Record<OrderStatus, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
    pending: 'warning',
    paid: 'success',
    processing: 'info',
    shipped: 'info',
    delivered: 'success',
    cancelled: 'danger'
  }
  return severities[status]
}

const goToOrder = (id: number) => {
  router.push(`/orders/${id}`)
}
</script>
