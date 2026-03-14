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
                  {{ store.currentConfig.gateway.configured ? 'PayPhone configurado' : 'PayPhone no configurado' }}
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="store.currentConfig.gateway.configured ? 'text-green-700' : 'text-yellow-700'"
                >
                  {{ store.currentConfig.gateway.configured
                    ? 'Tus credenciales están guardadas.'
                    : 'Configura tus credenciales de PayPhone para recibir pagos en Ecuador.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de PayPhone</h3>
              <div class="space-y-4">
                <div>
                  <label for="store_token" class="block text-sm font-medium text-secondary-700 mb-2">
                    Store Token <span class="text-red-500">*</span>
                  </label>
                  <Password id="store_token" v-model="formData.store_token" placeholder="Tu Store Token (Bearer)"
                    class="w-full" :class="{ 'p-invalid': errors.store_token }" :feedback="false" toggleMask />
                  <small v-if="errors.store_token" class="text-red-500">{{ errors.store_token }}</small>
                </div>
                <div>
                  <label for="app_id" class="block text-sm font-medium text-secondary-700 mb-2">
                    App ID <span class="text-red-500">*</span>
                  </label>
                  <Password id="app_id" v-model="formData.app_id" placeholder="Tu App ID"
                    class="w-full" :class="{ 'p-invalid': errors.app_id }" :feedback="false" toggleMask />
                  <small v-if="errors.app_id" class="text-red-500">{{ errors.app_id }}</small>
                </div>
                <div>
                  <label for="app_secret" class="block text-sm font-medium text-secondary-700 mb-2">
                    App Secret <span class="text-red-500">*</span>
                  </label>
                  <Password id="app_secret" v-model="formData.app_secret" placeholder="Tu App Secret"
                    class="w-full" :class="{ 'p-invalid': errors.app_secret }" :feedback="false" toggleMask />
                  <small v-if="errors.app_secret" class="text-red-500">{{ errors.app_secret }}</small>
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

            <div class="flex gap-3 pt-4">
              <Button type="submit" :label="isConfigured ? 'Actualizar credenciales' : 'Guardar credenciales'"
                icon="pi pi-save" :loading="store.isSaving" size="large" />
              <Button v-if="isConfigured" type="button" label="Probar conexión" icon="pi pi-bolt"
                severity="info" outlined :loading="store.isTesting" @click="handleTest" size="large" />
              <Button v-if="isConfigured" type="button" label="Eliminar" icon="pi pi-trash"
                severity="danger" outlined @click="handleDelete" size="large" />
            </div>
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
              <h4 class="font-semibold text-secondary-800 mb-2">¿Qué es PayPhone?</h4>
              <p class="text-secondary-600">
                PayPhone es la plataforma de pagos móviles líder en Ecuador.
                Permite aceptar pagos con tarjeta de crédito, débito y la billetera PayPhone.
                Opera en dólares (USD).
              </p>
            </div>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo obtener mis credenciales?</h4>
              <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                <li>Regístrate en PayPhone Business</li>
                <li>Accede al panel de desarrolladores</li>
                <li>Obtén tu Store Token, App ID y App Secret</li>
              </ol>
            </div>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">Moneda</h4>
              <p class="text-secondary-600">
                PayPhone opera en <strong>USD (Dólar estadounidense)</strong>,
                la moneda oficial de Ecuador.
              </p>
            </div>
            <Divider />
            <Button label="Ir a PayPhone" icon="pi pi-external-link" link class="w-full"
              @click="openExternal('https://payphonetodoesposible.com/')" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import type { GatewayEnvironment } from '@/types/payment-gateway.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Password from 'primevue/password'
import RadioButton from 'primevue/radiobutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()
const GATEWAY_CODE = 'payphone'

interface PayPhoneFormData {
  store_token: string
  app_id: string
  app_secret: string
  environment: GatewayEnvironment
}

const formData = reactive<PayPhoneFormData>({
  store_token: '', app_id: '', app_secret: '', environment: 'prueba',
})

const errors = reactive({ store_token: '', app_id: '', app_secret: '' })
const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials as Record<string, any>
    formData.store_token = c.store_token || ''
    formData.app_id = c.app_id || ''
    formData.app_secret = c.app_secret || ''
    formData.environment = c.environment || 'prueba'
  }
}, { immediate: true })

onMounted(async () => {
  store.clearMessages()
  if (store.currentConfig?.credentials) {
    const creds = store.currentConfig.credentials.credentials as unknown as PayPhoneFormData
    if (creds) Object.assign(formData, creds)
  }
})

function validateForm(): boolean {
  Object.keys(errors).forEach(k => (errors as Record<string, string>)[k] = '')
  let valid = true
  if (!formData.store_token?.trim()) { errors.store_token = 'Requerido'; valid = false }
  if (!formData.app_id?.trim()) { errors.app_id = 'Requerido'; valid = false }
  if (!formData.app_secret?.trim()) { errors.app_secret = 'Requerido'; valid = false }
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
    message: '¿Estás seguro de eliminar las credenciales de PayPhone?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Eliminadas', detail: 'Credenciales eliminadas', life: 3000 })
        Object.assign(formData, { store_token: '', app_id: '', app_secret: '', environment: 'prueba' })
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
