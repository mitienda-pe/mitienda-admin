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
                  {{ isConfigured ? 'Mercado Pago configurado' : 'Mercado Pago no configurado' }}
                </h3>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Mercado Pago</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Access Token <span class="text-red-500">*</span></label>
                  <Password v-model="formData.access_token" placeholder="APP_USR-..." class="w-full" :feedback="false" toggleMask />
                  <small class="text-secondary-600">Token de acceso de tu aplicación de Mercado Pago</small>
                </div>

                <div class="flex items-center gap-2 mt-4">
                  <Checkbox v-model="formData.enable_financing" inputId="financing" :binary="true" />
                  <label for="financing" class="cursor-pointer">Habilitar financiamiento (cuotas)</label>
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
            <p class="text-secondary-600">Mercado Pago es la solución de pagos de Mercado Libre con soporte para financiamiento.</p>
            <Divider />
            <div>
              <h4 class="font-semibold mb-2">Tarjeta de prueba</h4>
              <div class="bg-gray-100 p-3 rounded-lg font-mono text-xs">
                <p><strong>Número:</strong> 4009 1753 3280 6176</p>
                <p><strong>CVV:</strong> 123</p>
              </div>
            </div>
            <Divider />
            <Button label="Ir a Mercado Pago" icon="pi pi-external-link" link class="w-full" @click="openMercadoPago" />
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
import Button from 'primevue/button'
import Card from 'primevue/card'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()
const GATEWAY_CODE = 'mercadopago'

const formData = reactive({
  access_token: '',
  enable_financing: false,
  environment: 'integracion' as 'produccion' | 'integracion'
})

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)
onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  if (!formData.access_token) {
    toast.add({ severity: 'warn', summary: 'Access Token requerido', life: 3000 })
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

function openMercadoPago() {
  window.open('https://www.mercadopago.com.pe/', '_blank')
}
</script>
