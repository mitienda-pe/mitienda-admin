<template>
  <!-- Mientras la plataforma no tenga credenciales de la pasarela, el pago con
       tarjeta no existe para el comercio: no vale la pena anunciarlo. El card
       aparece solo, sin desplegar nada, cuando se cargan las credenciales. -->
  <div
    v-if="store.config && !store.gatewayUnavailable"
    class="bg-white rounded-lg shadow p-6"
  >
    <div class="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 class="text-lg font-semibold text-secondary flex items-center gap-2">
          <i class="pi pi-credit-card text-primary" />
          Metodo de pago
        </h2>
        <p class="text-sm text-secondary-500 mt-1">
          Tarjeta con la que se cobra la renovacion de tu plan
        </p>
      </div>

      <AppButton
        v-if="store.hasPaymentMethod"
        label="Cambiar tarjeta"
        icon="pi pi-pencil"
        variant="outlined"
        size="small"
        @click="openDialog"
      />
    </div>

    <!-- Tarjeta guardada -->
    <div
      v-if="store.defaultMethod"
      class="space-y-4"
    >
      <div class="flex items-center justify-between gap-4 bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <i class="pi pi-credit-card text-2xl text-secondary-400" />
          <div>
            <p class="font-semibold text-secondary">
              {{ brandLabel(store.defaultMethod.card_brand) }} •••• {{ store.defaultMethod.card_last_four }}
            </p>
            <p class="text-xs text-secondary-500">
              Vence {{ expiryLabel(store.defaultMethod) }}
              <span v-if="store.defaultMethod.cardholder_name">
                · {{ store.defaultMethod.cardholder_name }}
              </span>
            </p>
          </div>
        </div>

        <AppButton
          label="Eliminar"
          icon="pi pi-trash"
          variant="text"
          size="small"
          :loading="store.isSaving"
          @click="confirmRemove(store.defaultMethod.id)"
        />
      </div>

      <div
        v-if="nextChargeLabel"
        class="text-sm text-secondary-500"
      >
        <i class="pi pi-calendar mr-1" />
        Proximo cargo: <span class="font-medium text-secondary">{{ nextChargeLabel }}</span>
      </div>
    </div>

    <!-- Sin tarjeta -->
    <div
      v-else
      class="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      <p class="text-sm text-secondary-500">
        Aun no registras una tarjeta. Al agregarla, tu plan se renueva solo y no tienes que coordinar cada pago.
      </p>
      <AppButton
        label="Agregar tarjeta"
        icon="pi pi-plus"
        size="small"
        @click="openDialog"
      />
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      header="Agregar tarjeta"
      :style="{ width: '480px' }"
      :breakpoints="{ '640px': '95vw' }"
      @hide="onDialogHide"
    >
      <div
        v-if="formError"
        class="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-700"
      >
        {{ formError }}
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary mb-1">Numero de tarjeta</label>
          <div
            id="mp-card-number"
            class="mp-field"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">Vencimiento</label>
            <div
              id="mp-card-expiration"
              class="mp-field"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">CVV</label>
            <div
              id="mp-card-cvv"
              class="mp-field"
            />
          </div>
        </div>

        <AppInput
          v-model="form.cardholderName"
          label="Nombre del titular"
          placeholder="Como figura en la tarjeta"
        />

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary mb-1">Tipo de documento</label>
            <Dropdown
              v-model="form.identificationType"
              :options="identificationTypes"
              option-label="name"
              option-value="id"
              class="w-full"
            />
          </div>
          <AppInput
            v-model="form.identificationNumber"
            label="Numero de documento"
          />
        </div>

        <p class="text-xs text-secondary-500">
          Los datos de la tarjeta viajan directo a MercadoPago; MiTienda solo guarda los ultimos
          cuatro digitos.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton
            label="Cancelar"
            variant="text"
            :disabled="isSubmitting"
            @click="dialogVisible = false"
          />
          <AppButton
            label="Guardar tarjeta"
            icon="pi pi-lock"
            :loading="isSubmitting"
            :disabled="!cardFormReady"
            @click="submitCard"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import { AppButton, AppInput } from '@/components/ui'
import { useBillingSubscriptionStore } from '@/stores/billingSubscription.store'
import { useMercadoPagoCard } from '@/composables/useMercadoPagoCard'
import { useFormatters } from '@/composables/useFormatters'
import type { BillingPaymentMethod } from '@/types/billing-subscription.types'

const store = useBillingSubscriptionStore()
const toast = useToast()
const confirm = useConfirm()
const { formatDate } = useFormatters()
const { identificationTypes, mount, createToken, unmount } = useMercadoPagoCard()

const dialogVisible = ref(false)
const cardFormReady = ref(false)
const isSubmitting = ref(false)
const formError = ref<string | null>(null)

const form = reactive({
  cardholderName: '',
  identificationType: 'DNI',
  identificationNumber: ''
})

const nextChargeLabel = computed(() => {
  const sub = store.subscription
  if (!sub?.next_charge_at) return null
  return `${sub.currency === 'USD' ? '$' : 'S/'} ${sub.amount_display} el ${formatDate(sub.next_charge_at)}`
})

function brandLabel(brand: string | null): string {
  if (!brand) return 'Tarjeta'
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}

function expiryLabel(method: BillingPaymentMethod): string {
  if (!method.card_exp_month || !method.card_exp_year) return '-'
  const month = String(method.card_exp_month).padStart(2, '0')
  return `${month}/${String(method.card_exp_year).slice(-2)}`
}

async function openDialog() {
  formError.value = null
  dialogVisible.value = true

  // Los campos seguros se montan por id, asi que el dialog tiene que estar en
  // el DOM antes de pedirle al SDK que los inyecte.
  await nextTick()

  try {
    await mount(store.config?.public_key ?? '', store.config?.locale ?? 'es-PE', {
      cardNumber: 'mp-card-number',
      expirationDate: 'mp-card-expiration',
      securityCode: 'mp-card-cvv'
    })
    cardFormReady.value = true
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo cargar el formulario de tarjeta'
    cardFormReady.value = false
  }
}

function onDialogHide() {
  unmount()
  cardFormReady.value = false
  formError.value = null
  form.cardholderName = ''
  form.identificationNumber = ''
}

async function submitCard() {
  formError.value = null

  if (!form.cardholderName.trim()) {
    formError.value = 'Ingresa el nombre del titular'
    return
  }
  if (!form.identificationNumber.trim()) {
    formError.value = 'Ingresa el numero de documento'
    return
  }

  isSubmitting.value = true

  try {
    const token = await createToken({
      cardholderName: form.cardholderName.trim(),
      identificationType: form.identificationType,
      identificationNumber: form.identificationNumber.trim()
    })

    await store.addCard(token)

    dialogVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Tarjeta guardada',
      detail: 'Tu plan se renovara automaticamente con esta tarjeta',
      life: 4000
    })
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo guardar la tarjeta'
  } finally {
    isSubmitting.value = false
  }
}

function confirmRemove(id: number) {
  confirm.require({
    message: 'Si eliminas la tarjeta, la renovacion de tu plan deja de ser automatica. ¿Continuar?',
    header: 'Eliminar tarjeta',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.removeCard(id)
        toast.add({ severity: 'success', summary: 'Tarjeta eliminada', life: 3000 })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'No se pudo eliminar',
          detail: err instanceof Error ? err.message : undefined,
          life: 5000
        })
      }
    }
  })
}

onMounted(() => {
  store.load()
})

onBeforeUnmount(() => {
  unmount()
})
</script>

<style scoped>
/* Los iframes del SDK se inyectan dentro de estos contenedores: el alto y el
   borde son nuestros, el input es de MercadoPago. */
.mp-field {
  height: 42px;
  padding: 0 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
}

.mp-field :deep(iframe) {
  width: 100%;
  height: 100%;
}
</style>
