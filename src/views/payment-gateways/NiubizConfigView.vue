<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <Card>
        <template #content>
          <!-- Estado actual -->
          <div
            v-if="store.currentConfig?.gateway"
            class="mb-6 p-4 rounded-lg"
            :class="isConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'"
          >
            <div class="flex items-start gap-3">
              <i :class="isConfigured ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-yellow-600'" class="text-xl"></i>
              <div>
                <h3 class="font-semibold" :class="isConfigured ? 'text-green-800' : 'text-yellow-800'">
                  {{ isConfigured ? 'Niubiz configurado' : 'Niubiz no configurado' }}
                </h3>
                <p class="text-sm mt-1" :class="isConfigured ? 'text-green-700' : 'text-yellow-700'">
                  {{ isConfigured
                    ? 'Tus credenciales están guardadas.'
                    : 'Configura tus credenciales de Niubiz para empezar a recibir pagos.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Niubiz</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Merchant ID <span class="text-red-500">*</span>
                  </label>
                  <Password
                    v-model="formData.merchant_id"
                    placeholder="Tu Merchant ID"
                    class="w-full"
                    :feedback="false"
                    toggleMask
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Cybersource Code <span class="text-red-500">*</span>
                  </label>
                  <Password
                    v-model="formData.cybersource_code"
                    placeholder="Tu código Cybersource"
                    class="w-full"
                    :feedback="false"
                    toggleMask
                  />
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
                  <label for="env_test" class="cursor-pointer">Integración</label>
                </div>
              </div>
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>
            <Message v-if="store.successMessage" severity="success" :closable="false">{{ store.successMessage }}</Message>

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
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle"></i>
            <span>Información</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4 text-sm">
            <p class="text-secondary-600">
              Niubiz es la solución de pagos del BBVA Continental para comercios en Perú.
            </p>
            <Divider />
            <div>
              <h4 class="font-semibold text-secondary-800 mb-2">Tarjeta de prueba</h4>
              <div class="bg-gray-100 p-3 rounded-lg font-mono text-xs">
                <p><strong>Número:</strong> 4919 1481 0785 9067</p>
                <p><strong>Vencimiento:</strong> 12/25</p>
                <p><strong>CVV:</strong> 123</p>
              </div>
            </div>
            <Divider />
            <Button label="Ir a Niubiz" icon="pi pi-external-link" link class="w-full" @click="openNiubiz" />
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
import RadioButton from 'primevue/radiobutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()
const GATEWAY_CODE = 'niubiz'

const formData = reactive({
  merchant_id: '',
  cybersource_code: '',
  environment: 'integracion' as 'produccion' | 'integracion'
})

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  if (!formData.merchant_id || !formData.cybersource_code) {
    toast.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Completa todos los campos', life: 3000 })
    return
  }
  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, { credentials: formData, environment: formData.environment, enabled: true })
    : await store.saveCredentials(GATEWAY_CODE, { credentials: formData, environment: formData.environment, enabled: true })
  toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Éxito' : 'Error', detail: result.success ? 'Credenciales guardadas' : result.error, life: 3000 })
}

async function handleTest() {
  const result = await store.testConnection(GATEWAY_CODE)
  toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Conexión exitosa' : 'Error', detail: result.success ? `Ambiente: ${result.data?.environment}` : result.error, life: 3000 })
}

function handleDelete() {
  confirm.require({
    message: '¿Eliminar credenciales de Niubiz?',
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      if (result.success) {
        formData.merchant_id = ''
        formData.cybersource_code = ''
        formData.environment = 'integracion'
      }
      toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Eliminadas' : 'Error', detail: result.success ? 'Credenciales eliminadas' : result.error, life: 3000 })
    }
  })
}

function openNiubiz() {
  window.open('https://niubiz.com.pe/', '_blank')
}
</script>
