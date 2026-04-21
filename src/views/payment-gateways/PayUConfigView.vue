<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <Card>
        <template #content>
          <!-- Estado actual -->
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
                  {{ store.currentConfig.gateway.configured ? 'PayU configurado' : 'PayU no configurado' }}
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="store.currentConfig.gateway.configured ? 'text-green-700' : 'text-yellow-700'"
                >
                  {{ store.currentConfig.gateway.configured
                    ? 'Tus credenciales están guardadas.'
                    : 'Configura tus credenciales de PayU Latam para recibir pagos en Colombia y Ecuador.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de PayU</h3>
              <div class="space-y-4">
                <div>
                  <label for="api_key" class="block text-sm font-medium text-secondary-700 mb-2">
                    API Key <span class="text-red-500">*</span>
                  </label>
                  <Password id="api_key" v-model="formData.api_key" placeholder="Tu API Key"
                    class="w-full" :class="{ 'p-invalid': errors.api_key }" :feedback="false" toggleMask />
                  <small v-if="errors.api_key" class="text-red-500">{{ errors.api_key }}</small>
                </div>
                <div>
                  <label for="api_login" class="block text-sm font-medium text-secondary-700 mb-2">
                    API Login <span class="text-red-500">*</span>
                  </label>
                  <Password id="api_login" v-model="formData.api_login" placeholder="Tu API Login"
                    class="w-full" :class="{ 'p-invalid': errors.api_login }" :feedback="false" toggleMask />
                  <small v-if="errors.api_login" class="text-red-500">{{ errors.api_login }}</small>
                </div>
                <div>
                  <label for="merchant_id" class="block text-sm font-medium text-secondary-700 mb-2">
                    Merchant ID <span class="text-red-500">*</span>
                  </label>
                  <InputText id="merchant_id" v-model="formData.merchant_id" placeholder="Tu Merchant ID"
                    class="w-full" :class="{ 'p-invalid': errors.merchant_id }" />
                  <small v-if="errors.merchant_id" class="text-red-500">{{ errors.merchant_id }}</small>
                </div>
                <div>
                  <label for="account_id" class="block text-sm font-medium text-secondary-700 mb-2">
                    Account ID <span class="text-red-500">*</span>
                  </label>
                  <InputText id="account_id" v-model="formData.account_id" placeholder="Tu Account ID"
                    class="w-full" :class="{ 'p-invalid': errors.account_id }" />
                  <small v-if="errors.account_id" class="text-red-500">{{ errors.account_id }}</small>
                  <small class="text-secondary-500 mt-1 block">El Account ID es diferente por país (Colombia, Ecuador, etc.)</small>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Webhook URL -->
            <div v-if="webhookUrl">
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Configuracion de Webhook</h3>
              <div class="bg-gray-100 p-4 rounded-lg">
                <p class="text-sm text-secondary-700 mb-2">Configura este URL en tu panel de PayU:</p>
                <div class="flex items-center gap-2">
                  <code class="text-xs bg-white px-3 py-2 rounded border flex-1 break-all select-all">{{ webhookUrl }}</code>
                  <Button icon="pi pi-copy" text size="small" @click="copyWebhookUrl" v-tooltip="'Copiar'" />
                </div>
              </div>
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

            <div v-if="isConfigured" class="flex gap-3 pt-4">
              <Button type="button" label="Probar conexión" icon="pi pi-bolt"
                severity="info" outlined :loading="store.isTesting" @click="handleTest" size="large" />
              <Button type="button" label="Eliminar" icon="pi pi-trash"
                severity="danger" outlined @click="handleDelete" size="large" />
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
              <h4 class="font-semibold text-secondary-800 mb-2">¿Qué es PayU?</h4>
              <p class="text-secondary-600">
                PayU Latam es la pasarela de pagos líder en Colombia y con presencia en
                Ecuador, México y otros países de Latinoamérica. Acepta tarjetas de crédito,
                débito, PSE y métodos locales.
              </p>
            </div>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo obtener mis credenciales?</h4>
              <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                <li>Ingresa a tu panel de PayU</li>
                <li>Ve a Configuración → Datos técnicos</li>
                <li>Copia tu API Key, API Login, Merchant ID y Account ID</li>
              </ol>
            </div>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">Tarjeta de prueba</h4>
              <div class="bg-gray-100 p-3 rounded-lg font-mono text-xs">
                <p><strong>Número:</strong> 4111 1111 1111 1111</p>
                <p><strong>Vencimiento:</strong> 12/25</p>
                <p><strong>CVV:</strong> 123</p>
                <p><strong>Nombre:</strong> APPROVED</p>
              </div>
            </div>
            <Divider />
            <Button label="Ir a PayU" icon="pi pi-external-link" link class="w-full"
              @click="openExternal('https://www.payulatam.com/')" />
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
import { reactive, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import { useDirtyForm } from '@/composables/useDirtyForm'
import type { GatewayEnvironment } from '@/types/payment-gateway.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import RadioButton from 'primevue/radiobutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import { UnsavedChangesBar } from '@/components/ui'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()
const GATEWAY_CODE = 'payu'

interface PayUFormData {
  api_key: string
  api_login: string
  merchant_id: string
  account_id: string
  environment: GatewayEnvironment
}

const formData = reactive<PayUFormData>({
  api_key: '', api_login: '', merchant_id: '', account_id: '', environment: 'prueba',
})

const { isDirty, reset: resetDirty } = useDirtyForm(() => formData)

const errors = reactive({ api_key: '', api_login: '', merchant_id: '', account_id: '' })
const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)
const webhookUrl = computed(() => (store.currentConfig as any)?.webhook_url || null)

function copyWebhookUrl() {
  if (webhookUrl.value) {
    navigator.clipboard.writeText(webhookUrl.value)
    toast.add({ severity: 'success', summary: 'URL copiada al portapapeles', life: 2000 })
  }
}

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials as Record<string, any>
    formData.api_key = c.api_key || ''
    formData.api_login = c.api_login || ''
    formData.merchant_id = c.merchant_id || ''
    formData.account_id = c.account_id || ''
    formData.environment = c.environment || 'prueba'
  }
  resetDirty()
}, { immediate: true })

onMounted(async () => {
  store.clearMessages()
  if (store.currentConfig?.credentials) {
    const creds = store.currentConfig.credentials.credentials as unknown as PayUFormData
    if (creds) Object.assign(formData, creds)
  }
})

function validateForm(): boolean {
  Object.keys(errors).forEach(k => (errors as Record<string, string>)[k] = '')
  let valid = true
  if (!formData.api_key?.trim()) { errors.api_key = 'Requerido'; valid = false }
  if (!formData.api_login?.trim()) { errors.api_login = 'Requerido'; valid = false }
  if (!formData.merchant_id?.trim()) { errors.merchant_id = 'Requerido'; valid = false }
  if (!formData.account_id?.trim()) { errors.account_id = 'Requerido'; valid = false }
  return valid
}

async function handleSubmit() {
  if (!validateForm()) return
  store.clearMessages()
  const data = { credentials: { ...formData }, environment: formData.environment, enabled: true }
  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, data)
    : await store.saveCredentials(GATEWAY_CODE, data)
  toast.add({
    severity: result.success ? 'success' : 'error',
    summary: result.success ? 'Éxito' : 'Error',
    detail: result.success ? (isConfigured.value ? 'Credenciales actualizadas' : 'Credenciales guardadas') : (result.error || 'Error'),
    life: 3000,
  })
  if (result.success) resetDirty()
}

async function handleTest() {
  store.clearMessages()
  const result = await store.testConnection(GATEWAY_CODE)
  toast.add({
    severity: result.success ? 'success' : 'error',
    summary: result.success ? 'Conexión exitosa' : 'Error',
    detail: result.success ? `Conectado al ambiente de ${result.data?.environment}` : (result.error || 'No se pudo conectar'),
    life: 3000,
  })
}

function handleDelete() {
  confirm.require({
    message: '¿Estás seguro de eliminar las credenciales de PayU?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Eliminadas', detail: 'Credenciales eliminadas', life: 3000 })
        Object.assign(formData, { api_key: '', api_login: '', merchant_id: '', account_id: '', environment: 'prueba' })
      }
    },
  })
}

function openExternal(url: string) {
  window.open(url, '_blank')
}
</script>

<style scoped>
:deep(.p-inputtext),
:deep(.p-password input) {
  border: 1px solid #d1d5db !important;
}
</style>
