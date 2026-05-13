<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <Card>
        <template #content>
          <div
            v-if="store.currentConfig?.gateway"
            class="mb-6 p-4 rounded-lg"
            :class="isConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'"
          >
            <div class="flex items-start gap-3">
              <i :class="isConfigured ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-yellow-600'" class="text-xl"></i>
              <div>
                <h3 class="font-semibold" :class="isConfigured ? 'text-green-800' : 'text-yellow-800'">
                  {{ isConfigured ? 'Pay-Me configurado' : 'Pay-Me no configurado' }}
                </h3>
                <p class="text-sm mt-1" :class="isConfigured ? 'text-green-700' : 'text-yellow-700'">
                  {{ isConfigured
                    ? 'Tus credenciales están guardadas.'
                    : 'Configura tus credenciales de Pay-Me (Alignet Flex V2) para empezar a recibir pagos.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Pay-Me (Alignet Flex V2)</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Merchant Code <span class="text-red-500">*</span>
                  </label>
                  <InputText
                    v-model="formData.merchant_code"
                    placeholder="UUID alfanumérico del comercio"
                    class="w-full"
                  />
                  <small class="text-gray-500">
                    Identificador del comercio en Alignet V2 (formato UUID, ej. <code>a1b2c3d4-...</code>).
                  </small>
                </div>

                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Client ID <span class="text-red-500">*</span>
                  </label>
                  <InputText
                    v-model="formData.client_id"
                    placeholder="Client ID OAuth2"
                    class="w-full"
                  />
                  <small class="text-gray-500">Client ID alfanumérico de la app OAuth2 (auth.alignet.io).</small>
                </div>

                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Client Secret <span class="text-red-500">*</span>
                  </label>
                  <Password
                    v-model="formData.client_secret"
                    placeholder="Client Secret OAuth2"
                    class="w-full"
                    :feedback="false"
                    toggleMask
                  />
                  <small class="text-gray-500">
                    Secret de la app OAuth2. Va junto al Client ID para obtener el access token contra <code>auth.alignet.io/token</code>.
                  </small>
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
                  <RadioButton v-model="formData.environment" inputId="env_test" value="integracion" />
                  <label for="env_test" class="cursor-pointer">Integración (sandbox)</label>
                </div>
              </div>
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>
            <Message v-if="store.successMessage" severity="success" :closable="false">{{ store.successMessage }}</Message>

            <div v-if="isConfigured" class="flex gap-3 pt-4">
              <Button type="button" label="Probar" icon="pi pi-bolt" severity="info" outlined :loading="store.isTesting" @click="handleTest" />
              <Button type="button" label="Eliminar" icon="pi pi-trash" severity="danger" outlined @click="handleDelete" />
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
            <i class="pi pi-info-circle"></i>
            <span>Información</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4 text-sm">
            <p class="text-secondary-600">
              Pay-Me es la pasarela Flex V2 de Alignet. Soporta tarjeta con 3DS y se autentica vía OAuth2 contra <code>auth.alignet.io</code>.
            </p>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">Notas importantes</h4>
              <ul class="list-disc list-inside text-secondary-600 space-y-1 text-xs">
                <li>Las credenciales son distintas a VPOS2 legacy (numéricas). V2 usa <strong>UUID</strong> para merchant_code y alfanumérico para client_id.</li>
                <li>Si tu tienda migró desde VPOS2, pide a Alignet las nuevas credenciales V2.</li>
                <li>3DS se maneja automáticamente vía redirect a <code>continue_url</code> cuando es requerido.</li>
              </ul>
            </div>
            <Divider />
            <Button label="Ir a Alignet" icon="pi pi-external-link" link class="w-full" @click="openPayme" />
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
import type { PaymeCredentials, GatewayEnvironment } from '@/types/payment-gateway.types'
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
const GATEWAY_CODE = 'payme'

const formData = reactive<PaymeCredentials>({
  client_id: '',
  client_secret: '',
  merchant_code: '',
  environment: 'integracion'
})

const { isDirty, reset: resetDirty } = useDirtyForm(() => formData)

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials as Record<string, any>
    formData.client_id = c.client_id ?? ''
    formData.client_secret = c.client_secret ?? ''
    formData.merchant_code = c.merchant_code ?? ''
    formData.environment = c.environment ?? 'integracion'
  }
  resetDirty()
}, { immediate: true })

onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  if (!formData.merchant_code || !formData.client_id || !formData.client_secret) {
    toast.add({
      severity: 'warn',
      summary: 'Campos requeridos',
      detail: 'Completa Merchant Code, Client ID y Client Secret',
      life: 3000
    })
    return
  }

  const data = {
    credentials: { ...formData },
    environment: formData.environment as GatewayEnvironment,
    enabled: true
  }

  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, data)
    : await store.saveCredentials(GATEWAY_CODE, data)

  toast.add({
    severity: result.success ? 'success' : 'error',
    summary: result.success ? 'Éxito' : 'Error',
    detail: result.success ? 'Credenciales guardadas' : (result.error || ''),
    life: 3000
  })

  if (result.success) resetDirty()
}

async function handleTest() {
  const result = await store.testConnection(GATEWAY_CODE)
  toast.add({
    severity: result.success ? 'success' : 'error',
    summary: result.success ? 'Conexión exitosa' : 'Error',
    detail: result.success ? `Ambiente: ${result.data?.environment}` : (result.error || ''),
    life: 3000
  })
}

function handleDelete() {
  confirm.require({
    message: '¿Eliminar credenciales de Pay-Me?',
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      if (result.success) {
        formData.client_id = ''
        formData.client_secret = ''
        formData.merchant_code = ''
        formData.environment = 'integracion'
      }
      toast.add({
        severity: result.success ? 'success' : 'error',
        summary: result.success ? 'Eliminadas' : 'Error',
        detail: result.success ? 'Credenciales eliminadas' : (result.error || ''),
        life: 3000
      })
    }
  })
}

function openPayme() {
  window.open('https://alignet.io/', '_blank')
}
</script>
