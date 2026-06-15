<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { AppButton } from '@/components/ui'
import { useFormatters } from '@/composables/useFormatters'
import { ordersApi } from '@/api/orders.api'
import type {
  OrderNotificationsStatus,
  ResendNotificationChannel,
  ResendNotificationsResult
} from '@/types/order.types'

const props = defineProps<{
  orderId: number
}>()

const toast = useToast()
const { formatDateTime } = useFormatters()

const status = ref<OrderNotificationsStatus | null>(null)
const isLoading = ref(false)
const resendingChannel = ref<ResendNotificationChannel | null>(null)
const detailOpen = ref(false)

const webhook = computed(() => status.value?.webhook ?? null)
const sellerEmail = computed(() => status.value?.seller_email ?? null)
const hasSubscriptions = computed(() => (webhook.value?.active_subscriptions ?? 0) > 0)

const webhookBadge = computed(() => {
  if (!hasSubscriptions.value) {
    return { label: 'Sin suscripciones v2', cls: 'bg-gray-100 text-gray-600', icon: 'pi-minus-circle' }
  }
  switch (webhook.value?.last_status) {
    case 'success':
      return { label: 'Entregado', cls: 'bg-green-100 text-green-700', icon: 'pi-check-circle' }
    case 'failed':
      return { label: 'Falló', cls: 'bg-red-100 text-red-700', icon: 'pi-times-circle' }
    case 'pending':
      return { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700', icon: 'pi-clock' }
    default:
      return { label: 'Sin entregas', cls: 'bg-gray-100 text-gray-600', icon: 'pi-minus-circle' }
  }
})

const emailBadge = computed(() =>
  sellerEmail.value?.sent
    ? { label: 'Enviado', cls: 'bg-green-100 text-green-700', icon: 'pi-check-circle' }
    : { label: 'No enviado', cls: 'bg-gray-100 text-gray-600', icon: 'pi-minus-circle' }
)

const deliveries = computed(() => webhook.value?.deliveries ?? [])

async function loadStatus() {
  if (!props.orderId) return
  isLoading.value = true
  try {
    const response = await ordersApi.getNotificationsStatus(props.orderId)
    status.value = response.success && response.data ? response.data : null
  } catch {
    // Silencioso: el detalle de orden no debe romperse si el endpoint no está.
    status.value = null
  } finally {
    isLoading.value = false
  }
}

function summarizeResult(channel: ResendNotificationChannel, result: ResendNotificationsResult): {
  severity: 'success' | 'warn' | 'error'
  detail: string
} {
  const parts: string[] = []
  let anyOk = false
  let anyFail = false

  if ((channel === 'webhook' || channel === 'both') && result.webhook) {
    const w = result.webhook
    if (w.error === 'subscriptions_unavailable') {
      parts.push('Webhook: sin suscripciones v2')
    } else if ((w.subscriptions ?? 0) === 0) {
      parts.push('Webhook: la tienda no tiene suscripciones v2 activas')
    } else if (w.ok) {
      parts.push(`Webhook: ${w.delivered}/${w.subscriptions} entregado(s)`)
      anyOk = true
    } else {
      parts.push(`Webhook: ${w.failed} falló de ${w.subscriptions}`)
      anyFail = true
    }
  }

  if ((channel === 'email' || channel === 'both') && result.email) {
    const e = result.email
    if (e.error === 'no_recipients_configured') {
      parts.push('Email: sin destinatarios configurados')
    } else if (e.ok) {
      parts.push(`Email: enviado a ${e.sent?.length ?? 0} destinatario(s)`)
      anyOk = true
    } else {
      parts.push(`Email: falló (${e.failed?.length ?? 0})`)
      anyFail = true
    }
  }

  const severity = anyFail ? (anyOk ? 'warn' : 'error') : anyOk ? 'success' : 'warn'
  return { severity, detail: parts.join(' · ') || 'Sin acciones realizadas' }
}

async function resend(channel: ResendNotificationChannel) {
  if (resendingChannel.value) return
  resendingChannel.value = channel
  try {
    const response = await ordersApi.resendNotifications(props.orderId, channel)
    if (response.success && response.data) {
      const { severity, detail } = summarizeResult(channel, response.data)
      toast.add({ severity, summary: 'Reenvío de notificación', detail, life: 5000 })
    } else {
      throw new Error('Respuesta inválida del servidor')
    }
    await loadStatus()
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo reenviar',
      detail: err?.response?.data?.message || err?.message,
      life: 5000
    })
  } finally {
    resendingChannel.value = null
  }
}

watch(
  () => props.orderId,
  (id) => {
    if (id) loadStatus()
  }
)

onMounted(() => {
  if (props.orderId) loadStatus()
})
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-bell text-primary" />
        <span>Notificaciones</span>
      </div>
      <p class="text-xs font-normal text-gray-500 mt-0.5">Confirmación de Venta/Pedido</p>
    </template>

    <template #content>
      <div
        v-if="isLoading && !status"
        class="flex items-center gap-2 text-sm text-gray-500 py-2"
      >
        <ProgressSpinner style="width: 16px; height: 16px" stroke-width="4" />
        <span>Cargando estado…</span>
      </div>

      <div v-else class="space-y-4">
        <!-- Webhook v2 -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800">Webhook al comercio (v2)</p>
            <p v-if="!hasSubscriptions" class="text-xs text-gray-500 mt-0.5">
              La tienda no tiene suscripciones v2 activas. El webhook legacy no se rastrea aquí.
            </p>
            <p
              v-else-if="webhook?.last_delivered_at"
              class="text-xs text-gray-500 mt-0.5"
            >
              Último intento: {{ formatDateTime(webhook.last_delivered_at) }}
              <span v-if="webhook.last_response_code"> · HTTP {{ webhook.last_response_code }}</span>
              <button
                type="button"
                class="ml-1 text-primary hover:text-primary-600 font-medium"
                @click="detailOpen = true"
              >
                Ver detalle
              </button>
            </p>
            <p v-else class="text-xs text-gray-500 mt-0.5">
              {{ webhook?.active_subscriptions }} suscripción(es) activa(s) · sin entregas registradas
            </p>
          </div>
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            :class="webhookBadge.cls"
          >
            <i class="pi text-[10px]" :class="webhookBadge.icon" />
            {{ webhookBadge.label }}
          </span>
        </div>

        <!-- Email al vendedor -->
        <div class="flex items-start justify-between gap-3 border-t border-gray-100 pt-3">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800">Email al vendedor</p>
            <p class="text-xs text-gray-500 mt-0.5">
              Correo "{{ sellerEmail?.is_paid ? 'Venta confirmada' : 'Nuevo pedido' }}" a los emails configurados.
            </p>
          </div>
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            :class="emailBadge.cls"
          >
            <i class="pi text-[10px]" :class="emailBadge.icon" />
            {{ emailBadge.label }}
          </span>
        </div>

        <!-- Acciones -->
        <div class="border-t border-gray-100 pt-3 flex flex-wrap items-center gap-2">
          <AppButton
            label="Reenviar notificación"
            icon="pi pi-send"
            size="small"
            :loading="resendingChannel === 'both'"
            :disabled="resendingChannel !== null"
            @click="resend('both')"
          />
          <AppButton
            label="Solo webhook"
            variant="text"
            size="small"
            :loading="resendingChannel === 'webhook'"
            :disabled="resendingChannel !== null"
            @click="resend('webhook')"
          />
          <AppButton
            label="Solo email"
            variant="text"
            size="small"
            :loading="resendingChannel === 'email'"
            :disabled="resendingChannel !== null"
            @click="resend('email')"
          />
        </div>
      </div>
    </template>
  </Card>

  <!-- Detalle de entregas del webhook -->
  <Dialog
    v-model:visible="detailOpen"
    modal
    header="Entregas del webhook"
    :style="{ width: '40rem' }"
    :breakpoints="{ '640px': '95vw' }"
  >
    <p v-if="deliveries.length === 0" class="text-sm text-gray-500">
      No hay entregas registradas para esta orden.
    </p>
    <ul v-else class="space-y-3 max-h-96 overflow-y-auto pr-1">
      <li
        v-for="d in deliveries"
        :key="d.id"
        class="border border-gray-200 rounded-md p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="d.status === 'success' ? 'bg-green-100 text-green-700' : d.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'"
          >
            {{ d.status === 'success' ? 'Entregado' : d.status === 'failed' ? 'Falló' : 'Pendiente' }}
          </span>
          <span class="text-xs text-gray-500">
            {{ formatDateTime(d.created_at) }}
          </span>
        </div>
        <p class="text-xs text-gray-600 mt-2 break-all">{{ d.url }}</p>
        <p class="text-xs text-gray-500 mt-1">
          HTTP {{ d.response_code ?? '—' }}
          · intento {{ d.attempt }}/{{ d.max_attempts }}
          <span v-if="d.duration_ms !== null"> · {{ d.duration_ms }} ms</span>
        </p>
        <pre
          v-if="d.response_body"
          class="mt-2 text-xs bg-gray-50 border border-gray-100 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-32"
        >{{ d.response_body }}</pre>
      </li>
    </ul>
  </Dialog>
</template>
