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
                  {{ isConfigured ? 'Kasnet QR configurado' : 'Kasnet QR no configurado' }}
                </h3>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Kasnet</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">API Key <span class="text-red-500">*</span></label>
                  <Password v-model="formData.api_key" placeholder="API Key proporcionada por Kasnet" class="w-full" :feedback="false" toggleMask />
                  <small class="text-secondary-500">Credencial entregada por Kasnet (Globokas) para el QR Interoperable v3.</small>
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
                  <RadioButton v-model="formData.environment" inputId="env_test" value="prueba" />
                  <label for="env_test">Prueba</label>
                </div>
              </div>
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>

            <div v-if="isConfigured" class="flex gap-3 pt-4">
              <Button type="button" label="Eliminar" icon="pi pi-trash" severity="danger" outlined @click="handleDelete" />
            </div>
            <button type="submit" class="hidden" :disabled="!isDirty" aria-hidden="true"></button>
          </form>
        </template>
      </Card>
    </div>

    <div>
      <Card>
        <template #title><div class="flex items-center gap-2"><i class="pi pi-info-circle"></i><span>Información</span></div></template>
        <template #content>
          <div class="space-y-4 text-sm">
            <p class="text-secondary-600">Kasnet QR Interoperable permite cobrar con QR a clientes que pagan desde cualquier billetera o app bancaria en Perú (Yape, Plin, banca móvil, etc.).</p>
            <Divider />
            <Button label="Ir a Kasnet" icon="pi pi-external-link" link class="w-full" @click="openKasnet" />
          </div>
        </template>
      </Card>

      <Card v-if="webhookUrl" class="mt-4">
        <template #title><div class="flex items-center gap-2"><i class="pi pi-link"></i><span>Webhook</span></div></template>
        <template #content>
          <div class="space-y-3 text-sm">
            <p class="text-secondary-600">Configura esta URL en tu panel de Kasnet para recibir notificaciones de pago:</p>
            <div class="flex items-center gap-2">
              <InputText :modelValue="webhookUrl" readonly class="w-full text-xs" />
              <Button icon="pi pi-copy" severity="secondary" outlined @click="copyWebhookUrl" v-tooltip.top="'Copiar'" />
            </div>
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
const GATEWAY_CODE = 'kasnet-qr'

const webhookUrl = computed(() => (store.currentConfig as any)?.webhook_url || null)

const formData = reactive({
  api_key: '',
  environment: 'prueba' as 'produccion' | 'prueba',
})

const { isDirty, reset: resetDirty } = useDirtyForm(() => formData)

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials as Record<string, any>
    formData.api_key = c.api_key ?? ''
    formData.environment = c.environment ?? 'prueba'
  }
  resetDirty()
}, { immediate: true })

onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  if (!formData.api_key) {
    toast.add({ severity: 'warn', summary: 'API Key requerida', life: 3000 })
    return
  }
  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, { credentials: formData, environment: formData.environment, enabled: true })
    : await store.saveCredentials(GATEWAY_CODE, { credentials: formData, environment: formData.environment, enabled: true })
  toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Éxito' : 'Error', life: 3000 })
  if (result.success) resetDirty()
}

function handleDelete() {
  confirm.require({
    message: '¿Eliminar credenciales?', header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Eliminadas' : 'Error', life: 3000 })
    },
  })
}

function copyWebhookUrl() {
  if (webhookUrl.value) {
    navigator.clipboard.writeText(webhookUrl.value)
    toast.add({ severity: 'success', summary: 'URL copiada', life: 2000 })
  }
}

function openKasnet() {
  window.open('https://www.kasnet.com.pe/', '_blank')
}
</script>
