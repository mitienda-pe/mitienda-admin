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
                  {{ isConfigured ? 'Billeteras QR configuradas' : 'Billeteras QR no configuradas' }}
                </h3>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Yape Section -->
            <div class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span class="text-purple-600 font-bold">Y</span>
                  </div>
                  <h3 class="text-lg font-semibold text-secondary-800">Yape</h3>
                </div>
                <InputSwitch v-model="formData.yape_enabled" />
              </div>

              <div v-if="formData.yape_enabled" class="space-y-4 mt-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Business ID</label>
                  <InputText v-model="formData.yape_business_id" placeholder="ID de negocio Yape" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">URL del QR (opcional)</label>
                  <InputText v-model="formData.yape_qr_url" placeholder="https://..." class="w-full" />
                  <small class="text-secondary-600">Si tienes un QR personalizado, ingresa la URL de la imagen</small>
                </div>
              </div>
            </div>

            <!-- Plin Section -->
            <div class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span class="text-cyan-600 font-bold">P</span>
                  </div>
                  <h3 class="text-lg font-semibold text-secondary-800">Plin</h3>
                </div>
                <InputSwitch v-model="formData.plin_enabled" />
              </div>

              <div v-if="formData.plin_enabled" class="space-y-4 mt-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Business ID</label>
                  <InputText v-model="formData.plin_business_id" placeholder="ID de negocio Plin" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">URL del QR (opcional)</label>
                  <InputText v-model="formData.plin_qr_url" placeholder="https://..." class="w-full" />
                </div>
              </div>
            </div>

            <Divider />

            <!-- Instrucciones -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">Instrucciones para el cliente (opcional)</label>
              <Textarea
                v-model="formData.instructions"
                placeholder="Instrucciones que verá el cliente al elegir este método de pago..."
                rows="3"
                class="w-full"
              />
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>

            <div class="flex gap-3 pt-4">
              <Button type="submit" :label="isConfigured ? 'Actualizar' : 'Guardar'" icon="pi pi-save" :loading="store.isSaving" />
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
            <p class="text-secondary-600">
              Permite a tus clientes pagar escaneando un código QR con Yape o Plin.
            </p>
            <Divider />
            <div>
              <h4 class="font-semibold mb-2">Cómo funciona</h4>
              <ol class="list-decimal list-inside text-secondary-600 space-y-1">
                <li>El cliente elige Yape o Plin</li>
                <li>Escanea el código QR mostrado</li>
                <li>Realiza el pago desde su app</li>
                <li>Confirma el pago en tu tienda</li>
              </ol>
            </div>
            <Divider />
            <div class="bg-yellow-50 p-3 rounded-lg">
              <p class="text-yellow-800 text-xs">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                Los pagos con QR requieren confirmación manual.
              </p>
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
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()
const GATEWAY_CODE = 'qr-wallets'

const formData = reactive({
  yape_enabled: false,
  yape_business_id: '',
  yape_qr_url: '',
  plin_enabled: false,
  plin_business_id: '',
  plin_qr_url: '',
  instructions: ''
})

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)
onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  if (!formData.yape_enabled && !formData.plin_enabled) {
    toast.add({ severity: 'warn', summary: 'Habilita al menos una billetera', life: 3000 })
    return
  }
  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, { credentials: formData, environment: 'produccion', enabled: true })
    : await store.saveCredentials(GATEWAY_CODE, { credentials: formData, environment: 'produccion', enabled: true })
  toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Éxito' : 'Error', life: 3000 })
}

function handleDelete() {
  confirm.require({
    message: '¿Eliminar configuración?', header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Eliminadas' : 'Error', life: 3000 })
    }
  })
}
</script>
