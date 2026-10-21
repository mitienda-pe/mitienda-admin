<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useFormatters } from '@/composables/useFormatters'
import { ordersApi } from '@/api/orders.api'
import type { OrderPaymentHistoryEntry } from '@/types/order.types'

const props = defineProps<{
  orderId: number
  /** Estado actual de la orden: al cambiar se recarga el historial. */
  status?: string
}>()

const { formatDateTime } = useFormatters()

const entries = ref<OrderPaymentHistoryEntry[]>([])

const ACTION_LABELS: Record<string, string> = {
  approved: 'Pago aprobado',
  rejected: 'Pago rechazado',
  pending: 'Pago devuelto a pendiente'
}

const ACTION_ICONS: Record<string, string> = {
  approved: 'pi-check-circle text-primary',
  rejected: 'pi-times-circle text-red-500',
  pending: 'pi-clock text-yellow-600'
}

function actionLabel(entry: OrderPaymentHistoryEntry): string {
  return (entry.action && ACTION_LABELS[entry.action]) || 'Cambio de estado del pago'
}

function actionIcon(entry: OrderPaymentHistoryEntry): string {
  return (entry.action && ACTION_ICONS[entry.action]) || 'pi-history text-gray-500'
}

function authorLabel(entry: OrderPaymentHistoryEntry): string {
  if (!entry.author) return 'Usuario desconocido'
  return entry.author.name || entry.author.email || `Usuario #${entry.author.id}`
}

// Si la carga falla (p. ej. la migración aún no corrió) no se muestra nada:
// el historial es informativo y no debe ensuciar la tarjeta de Pago.
async function loadHistory() {
  try {
    const response = await ordersApi.listPaymentHistory(props.orderId)
    entries.value = response.success && response.data ? response.data : []
  } catch {
    entries.value = []
  }
}

watch(
  () => [props.orderId, props.status],
  ([id]) => {
    if (id) loadHistory()
  }
)

onMounted(() => {
  if (props.orderId) loadHistory()
})
</script>

<template>
  <div v-if="entries.length > 0" class="space-y-2">
    <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Historial del pago</p>
    <ul class="space-y-2">
      <li
        v-for="entry in entries"
        :key="entry.id"
        class="flex items-start gap-2"
      >
        <i class="pi text-sm mt-0.5" :class="actionIcon(entry)" />
        <div class="min-w-0">
          <p class="text-sm text-gray-900">
            {{ actionLabel(entry) }}
            <span class="text-gray-500">por</span>
            <span class="font-medium">{{ authorLabel(entry) }}</span>
            <span
              v-if="entry.impersonated"
              class="ml-1 text-xs text-gray-500 italic"
            >(soporte MiTienda)</span>
          </p>
          <p class="text-xs text-gray-500">
            {{ formatDateTime(entry.created_at) }}
            <span v-if="entry.source === 'pos'"> · desde el POS</span>
            <span v-if="entry.transaction_id"> · Op. {{ entry.transaction_id }}</span>
          </p>
          <p
            v-if="entry.notes"
            class="text-xs text-gray-600 whitespace-pre-wrap break-words"
          >{{ entry.notes }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
