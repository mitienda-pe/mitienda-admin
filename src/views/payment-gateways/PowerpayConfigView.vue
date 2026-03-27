<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <Card>
        <template #content>
          <div v-if="store.currentConfig?.gateway" class="mb-6 p-4 rounded-lg" :class="isConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
            <div class="flex items-start gap-3">
              <i :class="isConfigured ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-yellow-600'" class="text-xl"></i>
              <div>
                <h3 class="font-semibold" :class="isConfigured ? 'text-green-800' : 'text-yellow-800'">
                  {{ isConfigured ? 'Powerpay configurado' : 'Powerpay no configurado' }}
                </h3>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Powerpay</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Client ID <span class="text-red-500">*</span></label>
                  <InputText v-model="formData.client_id" placeholder="ck_xxxxx (Client Key proporcionado por Powerpay)" class="w-full" />
                  <small class="text-secondary-500">Se usa para los widgets de cuotas en la tienda.</small>
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Secret Key <span class="text-red-500">*</span></label>
                  <Password v-model="formData.secret_key" placeholder="Tu Secret Key" class="w-full" :feedback="false" toggleMask />
                  <small class="text-secondary-500">Clave secreta para autenticación con la API.</small>
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Merchant ID <span class="text-red-500">*</span></label>
                  <InputText v-model="formData.merchant_id" placeholder="Código de Merchant brindado por Powerpay" class="w-full" />
                  <small class="text-secondary-500">Identificador del comercio en la plataforma Powerpay.</small>
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Ambiente</h3>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <RadioButton v-model="formData.environment" inputId="env_prod" value="produccion" />
                  <label for="env_prod">Producción</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton v-model="formData.environment" inputId="env_test" value="integracion" />
                  <label for="env_test">Integración</label>
                </div>
              </div>
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>

            <div class="flex gap-3 pt-4">
              <Button type="submit" :label="isConfigured ? 'Actualizar' : 'Guardar'" icon="pi pi-save" :loading="store.isSaving" />
              <Button v-if="isConfigured" type="button" label="Probar" icon="pi pi-bolt" severity="info" outlined :loading="store.isTesting" @click="handleTest" />
              <Button v-if="isConfigured" type="button" label="Eliminar" icon="pi pi-trash" severity="danger" outlined @click="handleDelete" />
            </div>
          </form>
        </template>
      </Card>
    </div>

    <div>
      <Card>
        <template #title><div class="flex items-center gap-2"><i class="pi pi-info-circle"></i><span>Información</span></div></template>
        <template #content>
          <div class="space-y-4 text-sm">
            <p class="text-secondary-600">Powerpay es una solución de pagos BNPL (Buy Now Pay Later) que permite a tus clientes pagar en cuotas sin intereses.</p>
            <Divider />
            <Button label="Ir a Powerpay" icon="pi pi-external-link" link class="w-full" @click="openPowerpay" />
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
const GATEWAY_CODE = 'powerpay'

const formData = reactive({
  client_id: '',
  secret_key: '',
  merchant_id: '',
  environment: 'integracion' as 'produccion' | 'integracion'
})

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials as Record<string, any>
    formData.client_id = c.client_id || ''
    formData.secret_key = c.secret_key || ''
    formData.merchant_id = c.merchant_id || ''
    formData.environment = c.environment || 'integracion'
  }
}, { immediate: true })

onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  if (!formData.client_id || !formData.secret_key || !formData.merchant_id) {
    toast.add({ severity: 'warn', summary: 'Campos requeridos', life: 3000 })
    return
  }
  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, { credentials: formData, environment: formData.environment, enabled: true })
    : await store.saveCredentials(GATEWAY_CODE, { credentials: formData, environment: formData.environment, enabled: true })
  toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Éxito' : 'Error', life: 3000 })
}

async function handleTest() {
  const result = await store.testConnection(GATEWAY_CODE)
  toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Conexión exitosa' : 'Error', life: 3000 })
}

function handleDelete() {
  confirm.require({
    message: '¿Eliminar credenciales?', header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Eliminadas' : 'Error', life: 3000 })
    }
  })
}

function openPowerpay() {
  window.open('https://www.powerpay.pe/', '_blank')
}
</script>
