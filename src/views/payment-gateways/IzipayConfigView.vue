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
                  {{ store.currentConfig.gateway.configured ? 'Izipay configurado' : 'Izipay no configurado' }}
                </h3>
                <p
                  class="text-sm mt-1"
                  :class="store.currentConfig.gateway.configured ? 'text-green-700' : 'text-yellow-700'"
                >
                  {{ store.currentConfig.gateway.configured
                    ? 'Tus credenciales están guardadas. Puedes actualizarlas o probar la conexión.'
                    : 'Configura tus credenciales de Izipay para empezar a recibir pagos.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Formulario -->
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Credenciales API -->
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Izipay</h3>

              <div class="space-y-4">
                <div>
                  <label for="merchant_code" class="block text-sm font-medium text-secondary-700 mb-2">
                    Merchant Code <span class="text-red-500">*</span>
                  </label>
                  <InputText
                    id="merchant_code"
                    v-model="formData.merchant_code"
                    placeholder="Tu código de comercio"
                    class="w-full"
                    :class="{ 'p-invalid': errors.merchant_code }"
                  />
                  <small v-if="errors.merchant_code" class="text-red-500">{{ errors.merchant_code }}</small>
                </div>

                <div>
                  <label for="api_key" class="block text-sm font-medium text-secondary-700 mb-2">
                    API Key <span class="text-red-500">*</span>
                  </label>
                  <Password
                    id="api_key"
                    v-model="formData.api_key"
                    placeholder="Tu API Key"
                    class="w-full"
                    :class="{ 'p-invalid': errors.api_key }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.api_key" class="text-red-500">{{ errors.api_key }}</small>
                </div>

                <div>
                  <label for="secret" class="block text-sm font-medium text-secondary-700 mb-2">
                    Secret <span class="text-red-500">*</span>
                  </label>
                  <Password
                    id="secret"
                    v-model="formData.secret"
                    placeholder="Tu Secret"
                    class="w-full"
                    :class="{ 'p-invalid': errors.secret }"
                    :feedback="false"
                    toggleMask
                  />
                  <small v-if="errors.secret" class="text-red-500">{{ errors.secret }}</small>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Métodos de pago -->
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Métodos de pago habilitados</h3>
              <p class="text-sm text-gray-600 mb-4">Selecciona los métodos de pago que deseas ofrecer a tus clientes</p>

              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div class="flex items-center gap-2">
                  <Checkbox
                    v-model="formData.payment_methods.card"
                    inputId="method_card"
                    :binary="true"
                    disabled
                  />
                  <label for="method_card" class="cursor-pointer">
                    <i class="pi pi-credit-card mr-1"></i> Tarjeta
                  </label>
                  <Tag value="Siempre activo" severity="info" class="ml-1" />
                </div>

                <div class="flex items-center gap-2">
                  <Checkbox
                    v-model="formData.payment_methods.yape"
                    inputId="method_yape"
                    :binary="true"
                  />
                  <label for="method_yape" class="cursor-pointer">Yape</label>
                </div>

                <div class="flex items-center gap-2">
                  <Checkbox
                    v-model="formData.payment_methods.banca_movil"
                    inputId="method_banca_movil"
                    :binary="true"
                  />
                  <label for="method_banca_movil" class="cursor-pointer">Banca Móvil</label>
                </div>

                <div class="flex items-center gap-2">
                  <Checkbox
                    v-model="formData.payment_methods.agente"
                    inputId="method_agente"
                    :binary="true"
                  />
                  <label for="method_agente" class="cursor-pointer">Agente</label>
                </div>

                <div class="flex items-center gap-2">
                  <Checkbox
                    v-model="formData.payment_methods.billetera"
                    inputId="method_billetera"
                    :binary="true"
                  />
                  <label for="method_billetera" class="cursor-pointer">Billetera</label>
                </div>

                <div class="flex items-center gap-2">
                  <Checkbox
                    v-model="formData.payment_methods.cuotealo"
                    inputId="method_cuotealo"
                    :binary="true"
                    disabled
                  />
                  <label for="method_cuotealo" class="cursor-pointer text-gray-400">Cuotéalo</label>
                  <Tag value="Próximamente" severity="secondary" class="ml-1" />
                </div>
              </div>
            </div>

            <Divider />

            <!-- Ambiente -->
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Ambiente</h3>

              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <RadioButton
                    v-model="formData.environment"
                    inputId="env_prod"
                    value="produccion"
                  />
                  <label for="env_prod" class="cursor-pointer">Producción</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton
                    v-model="formData.environment"
                    inputId="env_test"
                    value="integracion"
                  />
                  <label for="env_test" class="cursor-pointer">Integración (Pruebas)</label>
                </div>
              </div>
              <small class="text-secondary-600 mt-2 block">
                Usa el ambiente de integración para hacer pruebas antes de pasar a producción
              </small>
            </div>

            <!-- Mensajes -->
            <Message v-if="store.error" severity="error" :closable="false">
              {{ store.error }}
            </Message>
            <Message v-if="store.successMessage" severity="success" :closable="false">
              {{ store.successMessage }}
            </Message>

            <!-- Botones de acción -->
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

    <!-- Sidebar: Información -->
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
              <h4 class="font-semibold text-secondary-800 mb-2">¿Qué es Izipay?</h4>
              <p class="text-secondary-600">
                Izipay es una pasarela de pagos peruana que permite aceptar pagos con tarjeta,
                Yape, Banca Móvil y otros métodos locales.
              </p>
            </div>

            <Divider />

            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo obtener mis credenciales?</h4>
              <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                <li>Ingresa a tu panel de Izipay</li>
                <li>Ve a Configuración → API Keys</li>
                <li>Copia tu Merchant Code, API Key y Secret</li>
                <li>Pega las credenciales aquí</li>
              </ol>
            </div>

            <Divider />

            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">Tarjeta de prueba</h4>
              <div class="bg-gray-100 p-3 rounded-lg font-mono text-xs">
                <p><strong>Número:</strong> 4970 1000 0000 0055</p>
                <p><strong>Vencimiento:</strong> 12/25</p>
                <p><strong>CVV:</strong> 123</p>
              </div>
            </div>

            <Divider />

            <div>
              <Button
                label="Ir a Izipay"
                icon="pi pi-external-link"
                link
                class="w-full"
                @click="openIzipay"
              />
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
import type { IzipayCredentials, GatewayEnvironment } from '@/types/payment-gateway.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()

const GATEWAY_CODE = 'izipay'

const formData = reactive<IzipayCredentials>({
  api_key: '',
  merchant_code: '',
  secret: '',
  environment: 'integracion',
  payment_methods: {
    card: true,
    yape: false,
    banca_movil: false,
    agente: false,
    billetera: false,
    cuotealo: false
  }
})

const errors = reactive({
  api_key: '',
  merchant_code: '',
  secret: ''
})

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

onMounted(async () => {
  store.clearMessages()

  // Llenar formulario si ya hay configuración
  if (store.currentConfig?.credentials) {
    const creds = store.currentConfig.credentials.credentials as unknown as IzipayCredentials
    if (creds) {
      Object.assign(formData, {
        api_key: creds.api_key || '',
        merchant_code: creds.merchant_code || '',
        secret: creds.secret || '',
        environment: creds.environment || 'integracion',
        payment_methods: creds.payment_methods || formData.payment_methods
      })
    }
  }
})

function validateForm(): boolean {
  errors.api_key = ''
  errors.merchant_code = ''
  errors.secret = ''

  let valid = true

  if (!formData.merchant_code?.trim()) {
    errors.merchant_code = 'El Merchant Code es requerido'
    valid = false
  }

  if (!formData.api_key?.trim()) {
    errors.api_key = 'El API Key es requerido'
    valid = false
  }

  if (!formData.secret?.trim()) {
    errors.secret = 'El Secret es requerido'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) return

  store.clearMessages()

  const data = {
    credentials: { ...formData },
    environment: formData.environment as GatewayEnvironment,
    enabled: true
  }

  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, data)
    : await store.saveCredentials(GATEWAY_CODE, data)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: isConfigured.value ? 'Credenciales actualizadas' : 'Credenciales guardadas',
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'No se pudieron guardar las credenciales',
      life: 5000
    })
  }
}

async function handleTest() {
  store.clearMessages()

  const result = await store.testConnection(GATEWAY_CODE)

  if (result.success && result.data) {
    toast.add({
      severity: 'success',
      summary: 'Conexión exitosa',
      detail: `Conectado al ambiente de ${result.data.environment}`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error de conexión',
      detail: result.error || 'No se pudo conectar con Izipay',
      life: 5000
    })
  }
}

function handleDelete() {
  confirm.require({
    message: '¿Estás seguro de eliminar las credenciales de Izipay?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)

      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Eliminadas',
          detail: 'Credenciales eliminadas exitosamente',
          life: 3000
        })
        // Limpiar formulario
        Object.assign(formData, {
          api_key: '',
          merchant_code: '',
          secret: '',
          environment: 'integracion',
          payment_methods: {
            card: true,
            yape: false,
            banca_movil: false,
            agente: false,
            billetera: false,
            cuotealo: false
          }
        })
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'No se pudieron eliminar las credenciales',
          life: 5000
        })
      }
    }
  })
}

function openIzipay() {
  window.open('https://izipay.pe/', '_blank')
}
</script>

<style scoped>
:deep(.p-inputtext),
:deep(.p-password input) {
  border: 1px solid #d1d5db !important;
}
</style>
