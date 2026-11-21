<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <Card>
        <template #content>
          <div
            v-if="store.currentConfig?.gateway"
            class="mb-6 p-4 rounded-lg"
            :class="store.currentConfig.gateway.configured
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'"
          >
            <div class="flex items-start gap-3">
              <i
                :class="store.currentConfig.gateway.configured
                  ? 'pi pi-check-circle text-green-600'
                  : 'pi pi-exclamation-triangle text-yellow-600'"
                class="text-xl"
              ></i>
              <div>
                <h3
                  class="font-semibold"
                  :class="store.currentConfig.gateway.configured ? 'text-green-800' : 'text-yellow-800'"
                >
                  {{ store.currentConfig.gateway.configured ? 'ProntoPaga configurado' : 'ProntoPaga no configurado' }}
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="store.currentConfig.gateway.configured ? 'text-green-700' : 'text-yellow-700'"
                >
                  {{ store.currentConfig.gateway.configured
                    ? 'Tus credenciales están guardadas. Puedes actualizarlas o probar la conexión.'
                    : 'Ingresa las credenciales que te entregó ProntoPaga para cobrar en tu tienda.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de ProntoPaga</h3>
              <p class="text-sm text-secondary-600 mb-4">
                ProntoPaga te entrega un token y una clave secreta distintos para sandbox y para producción.
                No los mezcles.
              </p>
              <div class="space-y-4">
                <div>
                  <label for="api_token" class="block text-sm font-medium text-secondary-700 mb-2">
                    Token de API <span class="text-red-500">*</span>
                  </label>
                  <Password
                    id="api_token"
                    v-model="formData.api_token"
                    placeholder="Bearer token de ProntoPaga"
                    class="w-full"
                    :class="{ 'p-invalid': errors.api_token }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.api_token" class="text-red-500">{{ errors.api_token }}</small>
                </div>

                <div>
                  <label for="secret_key" class="block text-sm font-medium text-secondary-700 mb-2">
                    Clave secreta (secretKey) <span class="text-red-500">*</span>
                  </label>
                  <Password
                    id="secret_key"
                    v-model="formData.secret_key"
                    placeholder="Se usa solo para firmar, nunca se envía"
                    class="w-full"
                    :class="{ 'p-invalid': errors.secret_key }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.secret_key" class="text-red-500">{{ errors.secret_key }}</small>
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-2">Métodos de pago</h3>
              <p class="text-sm text-secondary-600 mb-4">
                Elige qué métodos ofreces en el checkout. Deben estar habilitados también en tu cuenta de ProntoPaga
                (usa "Probar conexión" para verlos).
              </p>
              <div class="space-y-3">
                <div v-for="m in METHODS" :key="m.key" class="flex items-start gap-2">
                  <Checkbox v-model="formData.payment_methods[m.key]" :inputId="`pp_${m.key}`" :binary="true" />
                  <label :for="`pp_${m.key}`" class="cursor-pointer">
                    <span class="font-medium text-secondary-800">{{ m.label }}</span>
                    <span class="block text-xs text-secondary-500">{{ m.hint }}</span>
                  </label>
                </div>
              </div>
              <small v-if="errors.payment_methods" class="text-red-500">{{ errors.payment_methods }}</small>
            </div>

            <Divider />

            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Ambiente</h3>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <RadioButton v-model="formData.environment" inputId="env_prod" value="produccion" />
                  <label for="env_prod" class="cursor-pointer">Producción</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton v-model="formData.environment" inputId="env_test" value="prueba" />
                  <label for="env_test" class="cursor-pointer">Sandbox (Pruebas)</label>
                </div>
              </div>
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>
            <Message v-if="store.successMessage" severity="success" :closable="false">{{ store.successMessage }}</Message>
            <Message v-if="testMessage" :severity="testOk ? 'success' : 'warn'" :closable="false">{{ testMessage }}</Message>

            <div v-if="isConfigured" class="flex gap-3 pt-4">
              <Button type="button" label="Probar conexión" icon="pi pi-bolt" severity="info" outlined :loading="store.isTesting" @click="handleTest" size="large" />
              <Button type="button" label="Eliminar" icon="pi pi-trash" severity="danger" outlined @click="handleDelete" size="large" />
            </div>
            <button type="submit" class="hidden" :disabled="!isDirty" aria-hidden="true"></button>
          </form>
        </template>
      </Card>
    </div>

    <div>
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle text-lg"></i>
            <span>Información</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4 text-sm">
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo funciona?</h4>
              <p class="text-secondary-600">
                Tu cliente elige el método en el checkout y paga en la página segura de ProntoPaga.
                La venta se confirma sola cuando ProntoPaga aprueba el pago.
              </p>
            </div>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">Ten en cuenta</h4>
              <ul class="list-disc list-inside space-y-2 text-secondary-600">
                <li>Solo para tiendas en soles (PEN).</li>
                <li>Con PagoEfectivo y código BCP la venta queda <strong>pendiente</strong> hasta que el cliente pague.</li>
                <li>El código BCP vence a los 30 minutos y no admite montos con céntimos.</li>
                <li>ProntoPaga pide el DNI, carné de extranjería o pasaporte de quien paga (no RUC).</li>
                <li>Los reembolsos con tarjeta se piden desde el panel de ProntoPaga.</li>
              </ul>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <UnsavedChangesBar
      :dirty="isDirty"
      :loading="store.isSaving"
      :save-label="isConfigured ? 'Actualizar' : 'Guardar'"
      @save="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import { useDirtyForm } from '@/composables/useDirtyForm'
import type { GatewayEnvironment } from '@/types/payment-gateway.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Password from 'primevue/password'
import RadioButton from 'primevue/radiobutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import { UnsavedChangesBar } from '@/components/ui'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()

const GATEWAY_CODE = 'prontopaga'

// Las llaves son las que el API acepta en payment_methods (json_keys de PaymentGatewayMap).
const METHODS = [
  { key: 'tarjeta', label: 'Tarjeta de crédito o débito', hint: 'Visa y Mastercard, con 3D Secure.' },
  { key: 'qr', label: 'QR', hint: 'El cliente escanea con Yape, Plin o su banca móvil.' },
  { key: 'pagoefectivo', label: 'PagoEfectivo', hint: 'Paga en agentes o banca por internet con un código.' },
  { key: 'codigo_bcp', label: 'Código de pago BCP', hint: 'Paga desde Yape, Banca Móvil BCP o agentes. Vence en 30 min.' },
] as const

type MethodKey = typeof METHODS[number]['key']
const METHOD_KEYS = METHODS.map(m => m.key) as MethodKey[]

interface ProntoPagaFormData {
  api_token: string
  secret_key: string
  environment: GatewayEnvironment
  payment_methods: Record<MethodKey, boolean>
}

function defaultMethods(): Record<MethodKey, boolean> {
  return { tarjeta: true, qr: false, pagoefectivo: false, codigo_bcp: false }
}

const formData = reactive<ProntoPagaFormData>({
  api_token: '',
  secret_key: '',
  environment: 'prueba',
  payment_methods: defaultMethods(),
})

const { isDirty, reset: resetDirty } = useDirtyForm(() => formData)

const errors = reactive({ api_token: '', secret_key: '', payment_methods: '' })
const testMessage = ref('')
const testOk = ref(false)

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials as Record<string, any>
    formData.api_token = c.api_token || ''
    formData.secret_key = c.secret_key || ''
    formData.environment = c.environment || 'prueba'
    const methods = defaultMethods()
    if (c.payment_methods && typeof c.payment_methods === 'object') {
      for (const key of METHOD_KEYS) {
        if (key in c.payment_methods) methods[key] = c.payment_methods[key] === true
      }
    }
    formData.payment_methods = methods
  }
  resetDirty()
}, { immediate: true })

function validateForm(): boolean {
  errors.api_token = ''
  errors.secret_key = ''
  errors.payment_methods = ''
  let valid = true
  if (!formData.api_token?.trim()) { errors.api_token = 'El token es requerido'; valid = false }
  if (!formData.secret_key?.trim()) { errors.secret_key = 'La clave secreta es requerida'; valid = false }
  if (!METHOD_KEYS.some(k => formData.payment_methods[k])) {
    errors.payment_methods = 'Activa al menos un método de pago'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  if (!validateForm()) return
  store.clearMessages()
  const data = { credentials: { ...formData, payment_methods: { ...formData.payment_methods } }, environment: formData.environment, enabled: true }
  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, data)
    : await store.saveCredentials(GATEWAY_CODE, data)
  toast.add({
    severity: result.success ? 'success' : 'error',
    summary: result.success ? 'Éxito' : 'Error',
    detail: result.success ? (isConfigured.value ? 'Credenciales actualizadas' : 'Credenciales guardadas') : (result.error || 'Error guardando credenciales'),
    life: 3000,
  })
  if (result.success) resetDirty()
}

async function handleTest() {
  store.clearMessages()
  testMessage.value = ''
  const result = await store.testConnection(GATEWAY_CODE)
  const data = result.data as Record<string, any> | undefined
  testOk.value = result.success && data?.connected !== false
  testMessage.value = data?.message || result.error || ''
  toast.add({
    severity: testOk.value ? 'success' : 'error',
    summary: testOk.value ? 'Conexión exitosa' : 'Error de conexión',
    detail: testOk.value ? `Conectado al ambiente de ${data?.environment}` : (testMessage.value || 'No se pudo conectar'),
    life: 3000,
  })
}

function handleDelete() {
  confirm.require({
    message: '¿Estás seguro de eliminar las credenciales de ProntoPaga?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Eliminadas', detail: 'Credenciales eliminadas', life: 3000 })
        Object.assign(formData, { api_token: '', secret_key: '', environment: 'prueba', payment_methods: defaultMethods() })
        testMessage.value = ''
      }
    },
  })
}
</script>

<style scoped>
:deep(.p-inputtext),
:deep(.p-password input) {
  border: 1px solid #d1d5db !important;
}
</style>
