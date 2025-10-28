<template>
  <div class="space-y-4">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-secondary-800">Configuración de Nubefact</h1>
      <p class="text-secondary-600 mt-1">Configura tus credenciales de facturación electrónica con Nubefact</p>
    </div>

    <!-- Loading state -->
    <div v-if="billingStore.isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna principal: Formulario -->
      <div class="lg:col-span-2">
        <Card>
          <template #content>
            <!-- Estado actual -->
            <div v-if="config" class="mb-6 p-4 rounded-lg" :class="config.configured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
              <div class="flex items-start gap-3">
                <i :class="config.configured ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-yellow-600'" class="text-xl"></i>
                <div>
                  <h3 class="font-semibold" :class="config.configured ? 'text-green-800' : 'text-yellow-800'">
                    {{ config.configured ? 'Nubefact configurado' : 'Nubefact no configurado' }}
                  </h3>
                  <p class="text-sm mt-1" :class="config.configured ? 'text-green-700' : 'text-yellow-700'">
                    {{ config.configured
                      ? 'Tus credenciales están guardadas. Puedes actualiz arlas o probar la conexión.'
                      : 'Configura tus credenciales de Nubefact para empezar a emitir comprobantes electrónicos.'
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Formulario -->
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Credenciales API -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Nubefact</h3>

                <div class="space-y-4">
                  <div>
                    <label for="nubefact_url" class="block text-sm font-medium text-secondary-700 mb-2">
                      URL de Nubefact <span class="text-red-500">*</span>
                    </label>
                    <InputText
                      id="nubefact_url"
                      v-model="formData.nubefact_url"
                      placeholder="https://api.nubefact.com/api/v1/..."
                      class="w-full"
                      :class="{ 'p-invalid': errors.nubefact_url }"
                    />
                    <small v-if="errors.nubefact_url" class="text-red-500">{{ errors.nubefact_url }}</small>
                    <small class="text-secondary-600 mt-1 block">
                      URL del endpoint de Nubefact para emitir comprobantes
                    </small>
                  </div>

                  <div>
                    <label for="api_token" class="block text-sm font-medium text-secondary-700 mb-2">
                      Token de autenticación <span class="text-red-500">*</span>
                    </label>
                    <Password
                      id="api_token"
                      v-model="formData.api_token"
                      placeholder="Token de Nubefact"
                      class="w-full"
                      :class="{ 'p-invalid': errors.api_token }"
                      :feedback="false"
                      toggleMask
                    />
                    <small v-if="errors.api_token" class="text-red-500">{{ errors.api_token }}</small>
                    <small class="text-secondary-600 mt-1 block">
                      Token proporcionado por Nubefact en tu panel de control
                    </small>
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Series de documentos -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Series de documentos</h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="serie_factura" class="block text-sm font-medium text-secondary-700 mb-2">
                      Serie de factura
                    </label>
                    <InputText
                      id="serie_factura"
                      v-model="formData.serie_factura"
                      placeholder="F001"
                      maxlength="4"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label for="numero_factura" class="block text-sm font-medium text-secondary-700 mb-2">
                      Número inicial
                    </label>
                    <InputNumber
                      id="numero_factura"
                      v-model="formData.numero_factura"
                      placeholder="1"
                      :min="1"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label for="serie_boleta" class="block text-sm font-medium text-secondary-700 mb-2">
                      Serie de boleta
                    </label>
                    <InputText
                      id="serie_boleta"
                      v-model="formData.serie_boleta"
                      placeholder="B001"
                      maxlength="4"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label for="numero_boleta" class="block text-sm font-medium text-secondary-700 mb-2">
                      Número inicial
                    </label>
                    <InputNumber
                      id="numero_boleta"
                      v-model="formData.numero_boleta"
                      placeholder="1"
                      :min="1"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Ambiente -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Ambiente de facturación</h3>

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
                      value="prueba"
                    />
                    <label for="env_test" class="cursor-pointer">Prueba</label>
                  </div>
                </div>
                <small class="text-secondary-600 mt-2 block">
                  Usa el ambiente de prueba para hacer tests antes de emitir comprobantes reales
                </small>
              </div>

              <Divider />

              <!-- Formato PDF -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Formato de impresión</h3>

                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <RadioButton
                      v-model="formData.pdf_format"
                      inputId="format_a4"
                      value="A4"
                    />
                    <label for="format_a4" class="cursor-pointer">A4 (Estándar)</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton
                      v-model="formData.pdf_format"
                      inputId="format_ticket"
                      value="TICKET"
                    />
                    <label for="format_ticket" class="cursor-pointer">Ticket (80mm)</label>
                  </div>
                </div>
                <small class="text-secondary-600 mt-2 block">
                  Formato predeterminado para generar el PDF del comprobante. Ticket es ideal para impresoras térmicas.
                </small>
              </div>

              <!-- Mensajes de error/éxito -->
              <Message v-if="billingStore.error" severity="error" :closable="false">
                {{ billingStore.error }}
              </Message>
              <Message v-if="billingStore.successMessage" severity="success" :closable="false">
                {{ billingStore.successMessage }}
              </Message>

              <!-- Botones de acción -->
              <div class="flex gap-3 pt-4">
                <Button
                  type="submit"
                  :label="config?.configured ? 'Actualizar credenciales' : 'Guardar credenciales'"
                  icon="pi pi-save"
                  :loading="billingStore.isSaving"
                  size="large"
                />
                <Button
                  v-if="config?.configured"
                  type="button"
                  label="Probar conexión"
                  icon="pi pi-bolt"
                  severity="info"
                  outlined
                  :loading="billingStore.isTesting"
                  @click="handleTest"
                  size="large"
                />
                <Button
                  v-if="config?.configured"
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
                <h4 class="font-semibold text-secondary-800 mb-2">¿Qué es Nubefact?</h4>
                <p class="text-secondary-600">
                  Nubefact es un proveedor de facturación electrónica que te permite emitir comprobantes válidos ante SUNAT.
                </p>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo obtener mis credenciales?</h4>
                <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                  <li>Ingresa a tu cuenta de Nubefact</li>
                  <li>Ve a Configuración → API</li>
                  <li>Copia tu Token de usuario</li>
                  <li>Pega las credenciales aquí</li>
                </ol>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">Documentos soportados</h4>
                <ul class="space-y-1 text-secondary-600">
                  <li>✓ Facturas</li>
                  <li>✓ Boletas de venta</li>
                  <li>✓ Notas de crédito</li>
                  <li>✓ Notas de débito</li>
                </ul>
              </div>

              <Divider />

              <div>
                <Button
                  label="Ir a Nubefact"
                  icon="pi pi-external-link"
                  link
                  class="w-full"
                  @click="openNubefact"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useBillingStore } from '@/stores/billing.store'
import type { SaveNubefactCredentialsRequest } from '@/types/billing.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Password from 'primevue/password'
import InputNumber from 'primevue/inputnumber'
import RadioButton from 'primevue/radiobutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()
const billingStore = useBillingStore()

const config = ref(billingStore.nubefactConfig)

const formData = reactive<SaveNubefactCredentialsRequest>({
  nubefact_url: '',
  api_token: '',
  serie_factura: '',
  numero_factura: undefined,
  serie_boleta: '',
  numero_boleta: undefined,
  environment: 'prueba',
  pdf_format: 'A4'
})

const errors = reactive({
  nubefact_url: '',
  api_token: ''
})

onMounted(async () => {
  billingStore.clearMessages()
  await billingStore.fetchNubefactConfig()
  config.value = billingStore.nubefactConfig

  // Llenar formulario si ya hay configuración
  if (config.value?.configured && config.value.credentials) {
    Object.assign(formData, {
      nubefact_url: config.value.credentials.nubefact_url || '',
      api_token: config.value.credentials.api_token,
      serie_factura: config.value.credentials.serie_factura || '',
      numero_factura: config.value.credentials.numero_factura ? parseInt(config.value.credentials.numero_factura) : undefined,
      serie_boleta: config.value.credentials.serie_boleta || '',
      numero_boleta: config.value.credentials.numero_boleta ? parseInt(config.value.credentials.numero_boleta) : undefined,
      environment: config.value.credentials.environment || 'prueba',
      pdf_format: config.value.credentials.pdf_format || 'A4'
    })
  }
})

function validateForm(): boolean {
  errors.nubefact_url = ''
  errors.api_token = ''

  let valid = true

  if (!formData.nubefact_url?.trim()) {
    errors.nubefact_url = 'La URL de Nubefact es requerida'
    valid = false
  } else if (!formData.nubefact_url.startsWith('http')) {
    errors.nubefact_url = 'La URL debe comenzar con http:// o https://'
    valid = false
  }

  if (!formData.api_token?.trim()) {
    errors.api_token = 'El token es requerido'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) return

  billingStore.clearMessages()

  const result = config.value?.configured
    ? await billingStore.updateNubefactCredentials(formData)
    : await billingStore.saveNubefactCredentials(formData)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: config.value?.configured ? 'Credenciales actualizadas' : 'Credenciales guardadas',
      life: 3000
    })
    config.value = billingStore.nubefactConfig
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
  billingStore.clearMessages()

  const result = await billingStore.testNubefactConnection()

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
      detail: result.error || 'No se pudo conectar con Nubefact',
      life: 5000
    })
  }
}

function handleDelete() {
  confirm.require({
    message: '¿Estás seguro de eliminar las credenciales de Nubefact?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await billingStore.deleteNubefactCredentials()

      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Eliminadas',
          detail: 'Credenciales eliminadas exitosamente',
          life: 3000
        })
        config.value = null
        Object.assign(formData, {
          nubefact_url: '',
          api_token: '',
          serie_factura: '',
          numero_factura: undefined,
          serie_boleta: '',
          numero_boleta: undefined,
          environment: 'prueba',
          pdf_format: 'A4'
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

function openNubefact() {
  window.open('https://www.nubefact.com/', '_blank')
}
</script>

<style scoped>
:deep(.p-inputtext),
:deep(.p-password input) {
  border: 1px solid #d1d5db !important;
}
</style>
