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
                  {{ store.currentConfig.gateway.configured ? 'dLocal configurado' : 'dLocal no configurado' }}
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="store.currentConfig.gateway.configured ? 'text-green-700' : 'text-yellow-700'"
                >
                  {{ store.currentConfig.gateway.configured
                    ? 'Tus credenciales están guardadas. Puedes actualizarlas o probar la conexión.'
                    : 'Configura tus credenciales de dLocal para aceptar pagos en múltiples países de Latinoamérica.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de dLocal</h3>
              <div class="space-y-4">
                <div>
                  <label for="api_key" class="block text-sm font-medium text-secondary-700 mb-2">
                    API Key (x-login) <span class="text-red-500">*</span>
                  </label>
                  <InputText
                    id="api_key"
                    v-model="formData.api_key"
                    placeholder="Tu API Key"
                    class="w-full"
                    :class="{ 'p-invalid': errors.api_key }"
                  />
                  <small v-if="errors.api_key" class="text-red-500">{{ errors.api_key }}</small>
                </div>

                <div>
                  <label for="secret_key" class="block text-sm font-medium text-secondary-700 mb-2">
                    Secret Key (x-trans-key) <span class="text-red-500">*</span>
                  </label>
                  <Password
                    id="secret_key"
                    v-model="formData.secret_key"
                    placeholder="Tu Secret Key"
                    class="w-full"
                    :class="{ 'p-invalid': errors.secret_key }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.secret_key" class="text-red-500">{{ errors.secret_key }}</small>
                </div>

                <div>
                  <label for="webhook_secret" class="block text-sm font-medium text-secondary-700 mb-2">
                    Webhook Secret <span class="text-red-500">*</span>
                  </label>
                  <Password
                    id="webhook_secret"
                    v-model="formData.webhook_secret"
                    placeholder="Tu Webhook Secret"
                    class="w-full"
                    :class="{ 'p-invalid': errors.webhook_secret }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.webhook_secret" class="text-red-500">{{ errors.webhook_secret }}</small>
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
              <Button type="submit" :label="isConfigured ? 'Actualizar credenciales' : 'Guardar credenciales'" icon="pi pi-save" :loading="store.isSaving" size="large" />
              <Button v-if="isConfigured" type="button" label="Probar conexión" icon="pi pi-bolt" severity="info" outlined :loading="store.isTesting" @click="handleTest" size="large" />
              <Button v-if="isConfigured" type="button" label="Eliminar" icon="pi pi-trash" severity="danger" outlined @click="handleDelete" size="large" />
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
              <h4 class="font-semibold text-secondary-800 mb-2">¿Qué es dLocal?</h4>
              <p class="text-secondary-600">
                dLocal es una plataforma de pagos multi-país para Latinoamérica. Con una sola
                integración puedes aceptar pagos en Chile, Colombia, México, Perú, Ecuador y más.
              </p>
            </div>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">Países soportados</h4>
              <p class="text-secondary-600">
                Argentina, Brasil, Chile, Colombia, Ecuador, México, Perú, Uruguay y más.
                Soporta tarjetas locales e internacionales, transferencias y métodos alternativos.
              </p>
            </div>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo obtener mis credenciales?</h4>
              <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                <li>Contacta al equipo comercial de dLocal</li>
                <li>Completa el proceso de onboarding</li>
                <li>Obtén tus credenciales del Dashboard</li>
                <li>Pega las credenciales aquí</li>
              </ol>
            </div>
            <Divider />
            <div>
              <Button label="Ir a dLocal" icon="pi pi-external-link" link class="w-full" @click="openExternal('https://dlocal.com/')" />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import type { GatewayEnvironment } from '@/types/payment-gateway.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import RadioButton from 'primevue/radiobutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()

const GATEWAY_CODE = 'dlocal'

interface DLocalFormData {
  api_key: string
  secret_key: string
  webhook_secret: string
  environment: GatewayEnvironment
}

const formData = reactive<DLocalFormData>({
  api_key: '',
  secret_key: '',
  webhook_secret: '',
  environment: 'prueba',
})

const errors = reactive({
  api_key: '',
  secret_key: '',
  webhook_secret: '',
})

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

onMounted(async () => {
  store.clearMessages()
  if (store.currentConfig?.credentials) {
    const creds = store.currentConfig.credentials.credentials as unknown as DLocalFormData
    if (creds) {
      Object.assign(formData, {
        api_key: creds.api_key || '',
        secret_key: creds.secret_key || '',
        webhook_secret: creds.webhook_secret || '',
        environment: creds.environment || 'prueba',
      })
    }
  }
})

function validateForm(): boolean {
  errors.api_key = ''
  errors.secret_key = ''
  errors.webhook_secret = ''
  let valid = true
  if (!formData.api_key?.trim()) { errors.api_key = 'El API Key es requerido'; valid = false }
  if (!formData.secret_key?.trim()) { errors.secret_key = 'El Secret Key es requerido'; valid = false }
  if (!formData.webhook_secret?.trim()) { errors.webhook_secret = 'El Webhook Secret es requerido'; valid = false }
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
    detail: result.success ? (isConfigured.value ? 'Credenciales actualizadas' : 'Credenciales guardadas') : (result.error || 'Error guardando credenciales'),
    life: 3000,
  })
}

async function handleTest() {
  store.clearMessages()
  const result = await store.testConnection(GATEWAY_CODE)
  toast.add({
    severity: result.success ? 'success' : 'error',
    summary: result.success ? 'Conexión exitosa' : 'Error de conexión',
    detail: result.success ? `Conectado al ambiente de ${result.data?.environment}` : (result.error || 'No se pudo conectar'),
    life: 3000,
  })
}

function handleDelete() {
  confirm.require({
    message: '¿Estás seguro de eliminar las credenciales de dLocal?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Eliminadas', detail: 'Credenciales eliminadas', life: 3000 })
        Object.assign(formData, { api_key: '', secret_key: '', webhook_secret: '', environment: 'prueba' })
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
