<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Columna principal: Formulario -->
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
                  {{ store.currentConfig.gateway.configured ? 'Transbank configurado' : 'Transbank no configurado' }}
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="store.currentConfig.gateway.configured ? 'text-green-700' : 'text-yellow-700'"
                >
                  {{ store.currentConfig.gateway.configured
                    ? 'Tus credenciales están guardadas. Puedes actualizarlas o probar la conexión.'
                    : 'Configura tus credenciales de Transbank Webpay Plus para empezar a recibir pagos en Chile.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Formulario -->
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Transbank</h3>

              <div class="space-y-4">
                <div>
                  <label for="commerce_code" class="block text-sm font-medium text-secondary-700 mb-2">
                    Código de Comercio <span class="text-red-500">*</span>
                  </label>
                  <InputText
                    id="commerce_code"
                    v-model="formData.commerce_code"
                    placeholder="Ej: 597055555532"
                    class="w-full"
                    :class="{ 'p-invalid': errors.commerce_code }"
                  />
                  <small v-if="errors.commerce_code" class="text-red-500">{{ errors.commerce_code }}</small>
                </div>

                <div>
                  <label for="api_key_secret" class="block text-sm font-medium text-secondary-700 mb-2">
                    API Key Secret <span class="text-red-500">*</span>
                  </label>
                  <Password
                    id="api_key_secret"
                    v-model="formData.api_key_secret"
                    placeholder="Tu API Key Secret"
                    class="w-full"
                    :class="{ 'p-invalid': errors.api_key_secret }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.api_key_secret" class="text-red-500">{{ errors.api_key_secret }}</small>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Ambiente -->
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Ambiente</h3>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <RadioButton v-model="formData.environment" inputId="env_prod" value="produccion" />
                  <label for="env_prod" class="cursor-pointer">Producción</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton v-model="formData.environment" inputId="env_test" value="integracion" />
                  <label for="env_test" class="cursor-pointer">Integración (Pruebas)</label>
                </div>
              </div>
              <small class="text-secondary-600 mt-2 block">
                Usa el ambiente de integración para hacer pruebas antes de pasar a producción
              </small>
            </div>

            <!-- Mensajes -->
            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>
            <Message v-if="store.successMessage" severity="success" :closable="false">{{ store.successMessage }}</Message>

            <!-- Botones -->
            <div class="flex gap-3 pt-4">
              <Button
                type="submit"
                :label="isConfigured ? 'Actualizar credenciales' : 'Guardar credenciales'"
                icon="pi pi-save"
                :loading="store.isSaving"
                size="large"
              />
              <Button
                v-if="isConfigured"
                type="button"
                label="Probar conexión"
                icon="pi pi-bolt"
                severity="info"
                outlined
                :loading="store.isTesting"
                @click="handleTest"
                size="large"
              />
              <Button
                v-if="isConfigured"
                type="button"
                label="Eliminar"
                icon="pi pi-trash"
                severity="danger"
                outlined
                @click="handleDelete"
                size="large"
              />
            </div>
          </form>
        </template>
      </Card>
    </div>

    <!-- Sidebar -->
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
              <h4 class="font-semibold text-secondary-800 mb-2">¿Qué es Transbank?</h4>
              <p class="text-secondary-600">
                Transbank es el principal procesador de pagos en Chile. Webpay Plus permite
                aceptar pagos con tarjetas de crédito y débito nacionales e internacionales.
              </p>
            </div>

            <Divider />

            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo obtener mis credenciales?</h4>
              <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                <li>Afíliate en Transbank</li>
                <li>Accede al portal de desarrolladores</li>
                <li>Obtén tu Código de Comercio y API Key Secret</li>
                <li>Pega las credenciales aquí</li>
              </ol>
            </div>

            <Divider />

            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">Credenciales de prueba</h4>
              <div class="bg-gray-100 p-3 rounded-lg font-mono text-xs">
                <p><strong>Comercio:</strong> 597055555532</p>
                <p><strong>Tarjeta:</strong> 4051 8856 0044 6623</p>
                <p><strong>RUT:</strong> 11.111.111-1</p>
                <p><strong>Clave:</strong> 123</p>
              </div>
            </div>

            <Divider />

            <div>
              <Button
                label="Ir a Transbank"
                icon="pi pi-external-link"
                link
                class="w-full"
                @click="openExternal('https://www.transbank.cl/')"
              />
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

const GATEWAY_CODE = 'transbank'

interface TransbankFormData {
  commerce_code: string
  api_key_secret: string
  environment: GatewayEnvironment
}

const formData = reactive<TransbankFormData>({
  commerce_code: '',
  api_key_secret: '',
  environment: 'integracion',
})

const errors = reactive({
  commerce_code: '',
  api_key_secret: '',
})

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials as Record<string, any>
    formData.commerce_code = c.commerce_code || ''
    formData.api_key_secret = c.api_key_secret || ''
    formData.environment = c.environment || 'integracion'
  }
}, { immediate: true })

onMounted(async () => {
  store.clearMessages()
  if (store.currentConfig?.credentials) {
    const creds = store.currentConfig.credentials.credentials as unknown as TransbankFormData
    if (creds) {
      Object.assign(formData, {
        commerce_code: creds.commerce_code || '',
        api_key_secret: creds.api_key_secret || '',
        environment: creds.environment || 'integracion',
      })
    }
  }
})

function validateForm(): boolean {
  errors.commerce_code = ''
  errors.api_key_secret = ''
  let valid = true
  if (!formData.commerce_code?.trim()) { errors.commerce_code = 'El Código de Comercio es requerido'; valid = false }
  if (!formData.api_key_secret?.trim()) { errors.api_key_secret = 'El API Key Secret es requerido'; valid = false }
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
    message: '¿Estás seguro de eliminar las credenciales de Transbank?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Eliminadas', detail: 'Credenciales eliminadas', life: 3000 })
        Object.assign(formData, { commerce_code: '', api_key_secret: '', environment: 'integracion' })
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
