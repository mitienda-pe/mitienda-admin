<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import { useToast } from 'primevue/usetoast'
import { AppButton } from '@/components/ui'
import { useFormatters } from '@/composables/useFormatters'
import { ordersApi } from '@/api/orders.api'
import type { OrderAbono, OrderAbonosSummary, OrderStatus } from '@/types/order.types'

/**
 * Abonos de un pedido: anticipo, pagos a cuenta y saldo.
 *
 * Registrar un abono no cambia el estado del pedido. Cuando el saldo queda en
 * cero se emite `confirm-payment` y el detalle aprueba el pago por el camino de
 * siempre (comprobante, avisos, ERP).
 */
const props = defineProps<{
  orderId: number
  /** Estado actual del pedido: al cambiar se recarga. */
  status: OrderStatus
}>()

const emit = defineEmits<{
  (e: 'confirm-payment'): void
}>()

const toast = useToast()
const { formatCurrency, formatDate, formatDateTime } = useFormatters()

const METHODS = ['Yape', 'Plin', 'Transferencia', 'Depósito', 'Efectivo', 'Tarjeta', 'Otro']

const STATUS_LABELS: Record<string, string> = {
  anulado: 'Anulado',
  devuelto: 'Devuelto',
  retenido: 'Retenido'
}

const summary = ref<OrderAbonosSummary | null>(null)
const isSaving = ref(false)
const cancellingId = ref<number | null>(null)

const registerOpen = ref(false)
const form = ref({ amount: null as number | null, date: new Date(), method: 'Yape', reference: '', note: '' })

const resolveOpen = ref(false)
const resolution = ref({
  outcome: 'devuelto' as 'devuelto' | 'retenido',
  date: new Date(),
  method: 'Transferencia',
  reference: '',
  note: ''
})

const payments = computed<OrderAbono[]>(() => summary.value?.payments ?? [])
const activePayments = computed(() => payments.value.filter((p) => p.status === 'vigente'))
const isPending = computed(() => props.status === 'pending')
const canRegister = computed(() => !!summary.value?.can_register && (summary.value?.balance ?? 0) > 0)
const canResolve = computed(() => !!summary.value?.can_register && activePayments.value.length > 0)

/** Fecha local Y-m-d. `toISOString()` pasa a UTC y de noche daría "mañana". */
function toYmd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** El API responde los rechazos con `fail()` de CI4: `{ messages: { mensaje } }`. */
function apiError(err: any, fallback: string): string {
  const data = err?.response?.data
  return data?.messages?.mensaje || data?.mensaje || data?.message || err?.message || fallback
}

// Si la carga falla (p. ej. la migración aún no corrió) no se muestra nada.
async function load() {
  try {
    const response = await ordersApi.getAbonos(props.orderId)
    summary.value = response.success && response.data ? response.data : null
  } catch {
    summary.value = null
  }
}

function openRegister() {
  form.value = {
    amount: summary.value && summary.value.paid > 0 ? summary.value.balance : null,
    date: new Date(),
    method: 'Yape',
    reference: '',
    note: ''
  }
  registerOpen.value = true
}

async function submitRegister() {
  if (!form.value.amount || form.value.amount <= 0 || isSaving.value) return
  isSaving.value = true
  try {
    const response = await ordersApi.createAbono(props.orderId, {
      amount: form.value.amount,
      date: toYmd(form.value.date),
      method: form.value.method,
      reference: form.value.reference.trim() || undefined,
      note: form.value.note.trim() || undefined
    })
    if (!response.success || !response.data) throw new Error('Respuesta inválida del servidor')

    summary.value = response.data
    registerOpen.value = false
    toast.add({
      severity: 'success',
      summary: 'Pago registrado',
      detail: response.data.settled
        ? 'El saldo quedó cubierto. Confirma el pago del pedido.'
        : `Saldo pendiente: ${formatCurrency(response.data.balance)}`,
      life: 4000
    })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar el pago', detail: apiError(err, ''), life: 5000 })
  } finally {
    isSaving.value = false
  }
}

async function cancelPayment(payment: OrderAbono) {
  const ok = window.confirm(
    `¿Anular el pago de ${formatCurrency(payment.amount)} del ${formatDate(payment.date)}? ` +
    'Úsalo solo si se registró por error: el pago queda en el historial como anulado.'
  )
  if (!ok) return
  cancellingId.value = payment.id
  try {
    const response = await ordersApi.cancelAbono(props.orderId, payment.id)
    if (!response.success || !response.data) throw new Error('Respuesta inválida del servidor')
    summary.value = response.data
    toast.add({ severity: 'success', summary: 'Pago anulado', life: 2500 })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'No se pudo anular', detail: apiError(err, ''), life: 5000 })
  } finally {
    cancellingId.value = null
  }
}

function openResolve() {
  resolution.value = { outcome: 'devuelto', date: new Date(), method: 'Transferencia', reference: '', note: '' }
  resolveOpen.value = true
}

const canSubmitResolve = computed(() =>
  resolution.value.outcome === 'devuelto'
    ? resolution.value.method.trim() !== ''
    : resolution.value.note.trim() !== ''
)

async function submitResolve() {
  if (!canSubmitResolve.value || isSaving.value) return
  isSaving.value = true
  try {
    const r = resolution.value
    const payload = r.outcome === 'devuelto'
      ? {
          outcome: 'devuelto' as const,
          date: toYmd(r.date),
          method: r.method,
          reference: r.reference.trim() || undefined,
          note: r.note.trim() || undefined
        }
      : { outcome: 'retenido' as const, note: r.note.trim() }

    const response = await ordersApi.resolveAbonos(props.orderId, payload)
    if (!response.success || !response.data) throw new Error('Respuesta inválida del servidor')
    summary.value = response.data
    resolveOpen.value = false
    toast.add({
      severity: 'success',
      summary: r.outcome === 'devuelto' ? 'Devolución registrada' : 'Retención registrada',
      detail: 'Ya puedes cancelar el pedido.',
      life: 4000
    })
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar', detail: apiError(err, ''), life: 5000 })
  } finally {
    isSaving.value = false
  }
}

watch(
  () => [props.orderId, props.status],
  ([id]) => {
    if (id) load()
  }
)

onMounted(() => {
  if (props.orderId) load()
})

defineExpose({ reload: load })
</script>

<template>
  <div v-if="summary && (payments.length > 0 || isPending)">
    <!-- Sin abonos: solo la entrada, en pedidos pendientes. -->
    <button
      v-if="payments.length === 0"
      type="button"
      class="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-600 font-medium transition-colors"
      @click="openRegister"
    >
      <i class="pi pi-wallet text-xs" />
      Registrar pago parcial (anticipo)
    </button>

    <div v-else class="space-y-3">
      <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Pagos parciales</p>

      <dl class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-gray-50 p-2">
          <dt class="text-xs text-gray-500">Total</dt>
          <dd class="text-sm font-semibold text-gray-900">{{ formatCurrency(summary.total) }}</dd>
        </div>
        <div class="rounded-lg bg-gray-50 p-2">
          <dt class="text-xs text-gray-500">Cobrado</dt>
          <dd class="text-sm font-semibold text-gray-900">{{ formatCurrency(summary.paid) }}</dd>
        </div>
        <div class="rounded-lg p-2" :class="summary.balance > 0 ? 'bg-yellow-50' : 'bg-primary/10'">
          <dt class="text-xs text-gray-500">Saldo</dt>
          <dd class="text-sm font-bold" :class="summary.balance > 0 ? 'text-yellow-700' : 'text-primary'">
            {{ formatCurrency(summary.balance) }}
          </dd>
        </div>
      </dl>

      <div
        v-if="summary.settled"
        class="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2"
      >
        <p class="text-sm text-gray-800">
          El saldo está cubierto. Confirma el pago para cerrar el pedido: se emite el comprobante y se avisa como en cualquier venta pagada.
        </p>
        <AppButton label="Confirmar pago" icon="pi pi-check" size="small" @click="emit('confirm-payment')" />
      </div>

      <ul class="space-y-2">
        <li
          v-for="payment in payments"
          :key="payment.id"
          class="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-2"
          :class="{ 'opacity-60': payment.status !== 'vigente' }"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900">
              {{ payment.method }}
              <span v-if="payment.reference" class="text-xs text-gray-500 font-mono">· {{ payment.reference }}</span>
              <span
                v-if="payment.status !== 'vigente'"
                class="ml-1 text-xs font-semibold text-red-600"
              >{{ STATUS_LABELS[payment.status] }}</span>
            </p>
            <p class="text-xs text-gray-500">
              {{ formatDate(payment.date) }}
              <span v-if="payment.author?.name">· {{ payment.author.name }}</span>
              <span v-if="payment.origin === 'cierre'">· saldo al marcar pagado</span>
            </p>
            <p v-if="payment.note && payment.origin !== 'cierre'" class="text-xs text-gray-600 break-words">{{ payment.note }}</p>
            <p v-if="payment.refund" class="text-xs text-gray-600">
              Devuelto el {{ formatDate(payment.refund.date) }} por {{ payment.refund.method }}
              <span v-if="payment.refund.reference" class="font-mono">· {{ payment.refund.reference }}</span>
            </p>
            <p v-else-if="payment.change?.note" class="text-xs text-gray-600 break-words">
              {{ payment.change.note }} · {{ formatDateTime(payment.change.at) }}
            </p>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <span
              class="text-sm font-semibold"
              :class="payment.status === 'vigente' ? 'text-gray-900' : 'text-gray-500 line-through'"
            >{{ formatCurrency(payment.amount) }}</span>
            <AppButton
              v-if="payment.status === 'vigente' && summary.can_register"
              icon="pi pi-times"
              variant="text"
              size="small"
              aria-label="Anular pago"
              :loading="cancellingId === payment.id"
              @click="cancelPayment(payment)"
            />
          </div>
        </li>
      </ul>

      <div class="flex flex-wrap items-center gap-3">
        <AppButton
          v-if="canRegister"
          label="Registrar pago"
          icon="pi pi-plus"
          size="small"
          @click="openRegister"
        />
        <button
          v-if="canResolve"
          type="button"
          class="text-xs text-gray-600 hover:text-gray-900 underline"
          @click="openResolve"
        >
          ¿Se cancela el pedido? Registrar devolución
        </button>
      </div>
    </div>

    <!-- Registrar un abono -->
    <Dialog
      v-model:visible="registerOpen"
      modal
      header="Registrar pago"
      :style="{ width: '28rem' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <p class="text-sm text-gray-500 mb-4">
        Anota cada pago que recibas a cuenta del pedido. El pedido sigue pendiente hasta cubrir el total.
        <span v-if="summary.paid > 0">Saldo actual: <strong>{{ formatCurrency(summary.balance) }}</strong>.</span>
        <span v-else>Total del pedido: <strong>{{ formatCurrency(summary.total) }}</strong>.</span>
      </p>

      <div class="space-y-3">
        <div>
          <label for="abono-amount" class="block text-sm font-medium text-gray-700 mb-1">Monto</label>
          <InputNumber
            v-model="form.amount"
            input-id="abono-amount"
            mode="decimal"
            :min-fraction-digits="2"
            :max-fraction-digits="2"
            :min="0"
            :max="summary.balance"
            class="w-full"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="abono-date" class="block text-sm font-medium text-gray-700 mb-1">Fecha del pago</label>
            <Calendar
              v-model="form.date"
              input-id="abono-date"
              date-format="dd/mm/yy"
              :max-date="new Date()"
              class="w-full"
            />
          </div>
          <div>
            <label for="abono-method" class="block text-sm font-medium text-gray-700 mb-1">Medio</label>
            <Dropdown v-model="form.method" input-id="abono-method" :options="METHODS" class="w-full" />
          </div>
        </div>
        <div>
          <label for="abono-reference" class="block text-sm font-medium text-gray-700 mb-1">N.° de operación (opcional)</label>
          <InputText id="abono-reference" v-model="form.reference" maxlength="100" class="w-full" />
        </div>
        <div>
          <label for="abono-note" class="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
          <InputText id="abono-note" v-model="form.note" maxlength="255" class="w-full" placeholder="Ej.: Adelanto del 50 %" />
        </div>
      </div>

      <template #footer>
        <AppButton label="Cancelar" variant="text" @click="registerOpen = false" />
        <AppButton
          label="Registrar"
          icon="pi pi-check"
          :loading="isSaving"
          :disabled="!form.amount || form.amount <= 0"
          @click="submitRegister"
        />
      </template>
    </Dialog>

    <!-- Qué pasó con el dinero antes de cancelar -->
    <Dialog
      v-model:visible="resolveOpen"
      modal
      header="Pagos de un pedido que se cancela"
      :style="{ width: '28rem' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <p class="text-sm text-gray-500 mb-4">
        El cliente pagó {{ formatCurrency(summary.paid) }} a cuenta. Indica qué pasó con ese dinero; después podrás cancelar el pedido.
      </p>

      <div class="space-y-3">
        <div class="flex flex-col gap-2">
          <label class="flex items-center gap-2 text-sm">
            <RadioButton v-model="resolution.outcome" value="devuelto" input-id="outcome-devuelto" />
            Se le devolvió al cliente
          </label>
          <label class="flex items-center gap-2 text-sm">
            <RadioButton v-model="resolution.outcome" value="retenido" input-id="outcome-retenido" />
            La tienda se queda con el pago
          </label>
        </div>

        <template v-if="resolution.outcome === 'devuelto'">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="refund-date" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <Calendar
                v-model="resolution.date"
                input-id="refund-date"
                date-format="dd/mm/yy"
                :max-date="new Date()"
                class="w-full"
              />
            </div>
            <div>
              <label for="refund-method" class="block text-sm font-medium text-gray-700 mb-1">Medio</label>
              <Dropdown v-model="resolution.method" input-id="refund-method" :options="METHODS" class="w-full" />
            </div>
          </div>
          <div>
            <label for="refund-reference" class="block text-sm font-medium text-gray-700 mb-1">N.° de operación (opcional)</label>
            <InputText id="refund-reference" v-model="resolution.reference" maxlength="100" class="w-full" />
          </div>
        </template>

        <div>
          <label for="resolution-note" class="block text-sm font-medium text-gray-700 mb-1">
            {{ resolution.outcome === 'retenido' ? 'Motivo' : 'Nota (opcional)' }}
          </label>
          <InputText
            id="resolution-note"
            v-model="resolution.note"
            maxlength="255"
            class="w-full"
            :placeholder="resolution.outcome === 'retenido' ? 'Ej.: Penalidad por cancelación, según condiciones' : ''"
          />
        </div>
      </div>

      <template #footer>
        <AppButton label="Cancelar" variant="text" @click="resolveOpen = false" />
        <AppButton
          label="Registrar"
          icon="pi pi-check"
          :loading="isSaving"
          :disabled="!canSubmitResolve"
          @click="submitResolve"
        />
      </template>
    </Dialog>
  </div>
</template>
