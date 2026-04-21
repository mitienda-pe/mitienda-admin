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
                  {{ store.currentConfig.gateway.configured ? 'Conekta configurado' : 'Conekta no configurado' }}
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="store.currentConfig.gateway.configured ? 'text-green-700' : 'text-yellow-700'"
                >
                  {{ store.currentConfig.gateway.configured
                    ? 'Tus credenciales están guardadas. Puedes actualizarlas o probar la conexión.'
                    : 'Configura tus credenciales de Conekta para empezar a recibir pagos en México.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Conekta</h3>
              <div class="space-y-4">
                <div>
                  <label for="public_key" class="block text-sm font-medium text-secondary-700 mb-2">
                    Public Key <span class="text-red-500">*</span>
                  </label>
                  <InputText
                    id="public_key"
                    v-model="formData.public_key"
                    placeholder="Ej: key_xxxxxxxxxxxxxxxx"
                    class="w-full"
                    :class="{ 'p-invalid': errors.public_key }"
                  />
                  <small v-if="errors.public_key" class="text-red-500">{{ errors.public_key }}</small>
                </div>

                <div>
                  <label for="private_key" class="block text-sm font-medium text-secondary-700 mb-2">
                    Private Key <span class="text-red-500">*</span>
                  </label>
                  <Password
                    id="private_key"
                    v-model="formData.private_key"
                    placeholder="Tu Private Key"
                    class="w-full"
                    :class="{ 'p-invalid': errors.private_key }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.private_key" class="text-red-500">{{ errors.private_key }}</small>
                </div>

                <div>
                  <label for="webhook_key" class="block text-sm font-medium text-secondary-700 mb-2">
                    Webhook Signing Key <span class="text-red-500">*</span>
                  </label>
                  <Password
                    id="webhook_key"
                    v-model="formData.webhook_key"
                    placeholder="Tu Webhook Signing Key"
                    class="w-full"
                    :class="{ 'p-invalid': errors.webhook_key }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.webhook_key" class="text-red-500">{{ errors.webhook_key }}</small>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Webhook URL -->
            <div v-if="webhookUrl">
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Configuracion de Webhook</h3>
              <div class="bg-gray-100 p-4 rounded-lg">
                <p class="text-sm text-secondary-700 mb-2">Configura este URL en tu panel de Conekta:</p>
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

            <div class="flex gap-3 pt-4">
              <Button type="submit" :label="isConfigured ? 'Actualizar credenciales' : 'Guardar credenciales'" icon="pi pi-save" :loading="store.isSaving" size="large" :disabled="!isDirty" />
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
              <h4 class="font-semibold text-secondary-800 mb-2">¿Qué es Conekta?</h4>
              <p class="text-secondary-600">
                Conekta es la plataforma líder de pagos en México. Permite aceptar pagos con
                tarjetas de crédito/débito, OXXO y SPEI.
              </p>
            </div>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo obtener mis credenciales?</h4>
              <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                <li>Crea una cuenta en Conekta</li>
                <li>Accede al Panel de desarrolladores</li>
                <li>Obtén tus llaves pública, privada y el Webhook Signing Key</li>
                <li>Pega las credenciales aquí</li>
              </ol>
            </div>
            <Divider />
            <div>
              <Button label="Ir a Conekta" icon="pi pi-external-link" link class="w-full" @click="openExternal('https://conekta.com/')" />
            </div>
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
import { useDirtyForm } from '@/composables/useDirtyForm'
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

const GATEWAY_CODE = 'conekta'

interface ConektaFormData {
  public_key: string
  private_key: string
  webhook_key: string
  environment: GatewayEnvironment
}

const formData = reactive<ConektaFormData>({
  public_key: '',
  private_key: '',
  webhook_key: '',
  environment: 'prueba',
})

const { isDirty, reset: resetDirty } = useDirtyForm(() => formData)

const errors = reactive({
  public_key: '',
  private_key: '',
  webhook_key: '',
})

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
    formData.public_key = c.public_key || ''
    formData.private_key = c.private_key || ''
    formData.webhook_key = c.webhook_key || ''
    formData.environment = c.environment || 'prueba'
  }
  resetDirty()
}, { immediate: true })

onMounted(async () => {
  store.clearMessages()
  if (store.currentConfig?.credentials) {
    const creds = store.currentConfig.credentials.credentials as unknown as ConektaFormData
    if (creds) {
      Object.assign(formData, {
        public_key: creds.public_key || '',
        private_key: creds.private_key || '',
        webhook_key: creds.webhook_key || '',
        environment: creds.environment || 'prueba',
      })
    }
  }
})

function validateForm(): boolean {
  errors.public_key = ''
  errors.private_key = ''
  errors.webhook_key = ''
  let valid = true
  if (!formData.public_key?.trim()) { errors.public_key = 'La Public Key es requerida'; valid = false }
  if (!formData.private_key?.trim()) { errors.private_key = 'La Private Key es requerida'; valid = false }
  if (!formData.webhook_key?.trim()) { errors.webhook_key = 'El Webhook Signing Key es requerido'; valid = false }
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
  if (result.success) resetDirty()
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
    message: '¿Estás seguro de eliminar las credenciales de Conekta?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Eliminadas', detail: 'Credenciales eliminadas', life: 3000 })
        Object.assign(formData, { public_key: '', private_key: '', webhook_key: '', environment: 'prueba' })
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
