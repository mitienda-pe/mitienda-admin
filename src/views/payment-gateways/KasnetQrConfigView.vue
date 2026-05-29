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
                <p v-if="isConfigured" class="text-sm mt-1" :class="isConfigured ? 'text-green-700' : 'text-yellow-700'">
                  {{ initialMode === 'aggregator'
                    ? 'Usando cuenta MiTienda. Los cobros se liquidan por transferencia.'
                    : 'Usando cuenta Kasnet propia. Los cobros van a tu RUC.' }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Modo de cobro</h3>
              <div class="space-y-3">
                <label class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                  :class="formData.mode === 'aggregator' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'">
                  <RadioButton v-model="formData.mode" inputId="mode_aggregator" value="aggregator" class="mt-0.5" />
                  <div class="flex-1">
                    <label for="mode_aggregator" class="font-medium text-secondary-800 cursor-pointer">
                      Usar cuenta MiTienda <span class="text-xs text-primary font-semibold ml-1">RECOMENDADO</span>
                    </label>
                    <p class="text-sm text-secondary-600 mt-1">
                      Los cobros se acreditan en la cuenta Kasnet de MiTienda.
                      Liquidamos a tu comercio por transferencia bancaria (ver
                      <em>Liquidaciones</em>). No necesitas firmar contrato directo con Kasnet.
                    </p>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                  :class="formData.mode === 'propio' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'">
                  <RadioButton v-model="formData.mode" inputId="mode_propio" value="propio" class="mt-0.5" />
                  <div class="flex-1">
                    <label for="mode_propio" class="font-medium text-secondary-800 cursor-pointer">
                      Cuenta Kasnet propia
                    </label>
                    <p class="text-sm text-secondary-600 mt-1">
                      Tienes tu propio comercio Kasnet con su API Key.
                      Los cobros van directo a tu RUC y Kasnet te liquida.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <Divider />

            <div v-if="formData.mode === 'propio'">
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Kasnet</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">API Key <span class="text-red-500">*</span></label>
                  <Password v-model="formData.api_key" placeholder="API Key proporcionada por Kasnet" class="w-full" :feedback="false" toggleMask @focus="clearMaskedApiKey" />
                  <small v-if="!isApiKeyDirty && hasStoredApiKey" class="text-secondary-500">
                    Hay una API key guardada (oculta). Pega una nueva para reemplazarla, o deja el campo vacío para mantener la actual.
                  </small>
                  <small v-else class="text-secondary-500">Credencial entregada por Kasnet (Globokas) para el QR Interoperable v3.</small>
                </div>
              </div>

              <Divider />
            </div>

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
              <small v-if="formData.mode === 'aggregator'" class="block text-secondary-500 mt-2">
                Determina contra qué entorno de Kasnet va el cobro (sandbox o producción).
              </small>
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>

            <div v-if="!isConfigured" class="pt-4">
              <Button
                type="button"
                label="Activar Kasnet QR"
                icon="pi pi-check"
                :loading="store.isSaving"
                @click="handleSubmit"
              />
              <p class="text-xs text-secondary-500 mt-2">
                Se activará con los valores seleccionados arriba. Podrás modificar el modo o ambiente después.
              </p>
            </div>

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
            <div class="flex justify-center">
              <img :src="logoKasnet" alt="Kasnet" class="h-12 object-contain" />
            </div>
            <p class="text-secondary-600">Kasnet QR Interoperable permite cobrar con QR a clientes que pagan desde cualquier billetera o app bancaria en Perú (Yape, Plin, banca móvil, etc.).</p>
            <Divider />
            <Button label="Ir a Kasnet" icon="pi pi-external-link" link class="w-full" @click="openKasnet" />
          </div>
        </template>
      </Card>

      <Card v-if="webhookUrl && formData.mode === 'propio'" class="mt-4">
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
import { reactive, computed, onMounted, ref, watch } from 'vue'
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
import logoKasnet from '@/assets/images/logo-kasnet.png'

type KasnetMode = 'aggregator' | 'propio'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()
const GATEWAY_CODE = 'kasnet-qr'

const webhookUrl = computed(() => (store.currentConfig as any)?.webhook_url || null)

const formData = reactive({
  mode: 'aggregator' as KasnetMode,
  api_key: '',
  environment: 'prueba' as 'produccion' | 'prueba',
})

// Modo detectado al cargar la pantalla (lo conservamos para mostrar copy
// y para decidir si en modo "propio" preservamos la key existente).
const initialMode = ref<KasnetMode>('aggregator')
const hasStoredApiKey = ref(false)
const isApiKeyDirty = ref(false)

const { isDirty, reset: resetDirty } = useDirtyForm(() => formData)

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

watch(() => store.currentConfig, (config) => {
  if (!config?.gateway) {
    // Sin configurar todavía → arranca en aggregator por default
    formData.mode = 'aggregator'
    formData.api_key = ''
    formData.environment = 'prueba'
    initialMode.value = 'aggregator'
    hasStoredApiKey.value = false
    isApiKeyDirty.value = false
    resetDirty()
    return
  }

  const c = (config.credentials || {}) as Record<string, any>
  const stored = c.api_key
  // Si el backend trae api_key con valor (incluso enmascarado) → la tienda
  // tiene su propia api_key cargada → modo propio.
  // Si viene null/'' → no hay key local, opera en modo aggregator.
  const detected: KasnetMode = stored && stored !== '' ? 'propio' : 'aggregator'
  initialMode.value = detected
  formData.mode = detected
  formData.api_key = '' // siempre vacío al cargar; el usuario decide si reemplaza
  formData.environment = (c.environment as 'produccion' | 'prueba') ?? 'prueba'
  hasStoredApiKey.value = !!stored
  isApiKeyDirty.value = false
  resetDirty()
}, { immediate: true })

watch(() => formData.api_key, (val) => {
  if (val && val.length > 0) isApiKeyDirty.value = true
})

// Si el usuario cambia el modo, reseteamos el campo api_key para evitar
// estados inconsistentes (p.ej. modo aggregator con texto residual en el input).
watch(() => formData.mode, (newMode, oldMode) => {
  if (newMode !== oldMode) {
    formData.api_key = ''
    isApiKeyDirty.value = false
  }
})

function clearMaskedApiKey() {
  if (formData.api_key.includes('•')) {
    formData.api_key = ''
  }
}

onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  // Validación: solo en modo "propio" la api_key importa.
  if (formData.mode === 'propio') {
    const switchingFromAggregator = initialMode.value === 'aggregator'
    // Si veniamos de aggregator (no hay key guardada) o nunca configurada,
    // exigimos que el usuario pegue una key.
    if ((switchingFromAggregator || !hasStoredApiKey.value) && !formData.api_key) {
      toast.add({ severity: 'warn', summary: 'API Key requerida', detail: 'En modo "Cuenta Kasnet propia" debes pegar la API Key.', life: 4000 })
      return
    }
  }

  const credentialsPayload: Record<string, any> = { environment: formData.environment }

  if (formData.mode === 'aggregator') {
    // Limpia la api_key (si había una) para que el service caiga al env aggregator.
    credentialsPayload.api_key = ''
  } else {
    // modo propio: solo enviamos api_key si el usuario pegó una nueva.
    // Si la dejó vacía y ya había una, mapCredentialsToColumns la preserva
    // automáticamente al no recibir la key.
    if (formData.api_key) {
      credentialsPayload.api_key = formData.api_key
    }
  }

  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, { credentials: credentialsPayload, environment: formData.environment, enabled: true })
    : await store.saveCredentials(GATEWAY_CODE, { credentials: credentialsPayload, environment: formData.environment, enabled: true })

  toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Éxito' : 'Error', life: 3000 })

  if (result.success) {
    formData.api_key = ''
    isApiKeyDirty.value = false
    initialMode.value = formData.mode
    hasStoredApiKey.value = formData.mode === 'propio'
    resetDirty()
  }
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
