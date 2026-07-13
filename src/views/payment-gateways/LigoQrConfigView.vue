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
                  {{ isConfigured ? 'Ligo QR configurado' : 'Ligo QR no configurado' }}
                </h3>
                <p v-if="isConfigured" class="text-sm mt-1" :class="isConfigured ? 'text-green-700' : 'text-yellow-700'">
                  {{ initialMode === 'aggregator'
                    ? 'Usando cuenta MiTienda. Los cobros se liquidan por transferencia.'
                    : 'Usando cuenta Ligo propia. Los cobros van a tu cuenta.' }}
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
                      Los cobros se acreditan en la cuenta Ligo de MiTienda.
                      Liquidamos a tu comercio por transferencia bancaria. No necesitas
                      firmar contrato directo con Ligo.
                    </p>
                  </div>
                </label>

                <label class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                  :class="formData.mode === 'propio' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'">
                  <RadioButton v-model="formData.mode" inputId="mode_propio" value="propio" class="mt-0.5" />
                  <div class="flex-1">
                    <label for="mode_propio" class="font-medium text-secondary-800 cursor-pointer">
                      Cuenta Ligo propia
                    </label>
                    <p class="text-sm text-secondary-600 mt-1">
                      Tienes tu propia cuenta Ligo con sus credenciales (usuario,
                      contraseña, companyId, clave privada RSA). Los cobros van directo
                      a tu cuenta.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <Divider />

            <div v-if="formData.mode === 'propio'">
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales de Ligo</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Usuario <span class="text-red-500">*</span></label>
                  <InputText v-model="formData.username" placeholder="Usuario asignado por Ligo" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Contraseña <span v-if="!hasStored.password" class="text-red-500">*</span></label>
                  <Password v-model="formData.password" placeholder="Contraseña de Ligo" class="w-full" :feedback="false" toggleMask />
                  <small v-if="hasStored.password" class="text-secondary-500">Hay una contraseña guardada. Déjala vacía para conservarla.</small>
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Company ID <span class="text-red-500">*</span></label>
                  <InputText v-model="formData.company_id" placeholder="companyId de Ligo" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">ID de Cuenta (idCuenta) <span class="text-red-500">*</span></label>
                  <InputText v-model="formData.account_id" placeholder="Cuenta donde se acreditan los cobros" class="w-full" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-secondary-700 mb-2">Código de comercio</label>
                    <InputText v-model="formData.merchant_code" placeholder="4829" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-secondary-700 mb-2">Código de sistema (sisOrigen)</label>
                    <InputText v-model="formData.sis_origen" placeholder="Asignado por Ligo" class="w-full" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Clave privada RSA <span v-if="!hasStored.private_key" class="text-red-500">*</span></label>
                  <Textarea v-model="formData.private_key" placeholder="-----BEGIN PRIVATE KEY-----..." rows="4" class="w-full font-mono text-xs" />
                  <small v-if="hasStored.private_key" class="text-secondary-500">Hay una clave privada guardada. Déjala vacía para conservarla.</small>
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
                Determina contra qué entorno de Ligo va el cobro (sandbox o producción).
              </small>
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>

            <div v-if="!isConfigured" class="pt-4">
              <Button
                type="button"
                label="Activar Ligo QR"
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
              <img :src="logoLigo" alt="Ligo" class="h-12 object-contain" />
            </div>
            <p class="text-secondary-600">Ligo QR interoperable (BCRP/CCE) permite cobrar con QR a clientes que pagan desde cualquier billetera o app bancaria en Perú (Yape, Plin, banca móvil, etc.).</p>
            <Divider />
            <Button label="Ir a Ligo" icon="pi pi-external-link" link class="w-full" @click="openLigo" />
          </div>
        </template>
      </Card>

      <Card v-if="webhookUrl && formData.mode === 'propio'" class="mt-4">
        <template #title><div class="flex items-center gap-2"><i class="pi pi-link"></i><span>Webhook</span></div></template>
        <template #content>
          <div class="space-y-3 text-sm">
            <p class="text-secondary-600">Configura esta URL en tu panel de Ligo para recibir notificaciones de pago:</p>
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
import { paymentGatewaysApi } from '@/api/payment-gateways.api'
import { useDirtyForm } from '@/composables/useDirtyForm'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Textarea from 'primevue/textarea'
import RadioButton from 'primevue/radiobutton'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import { UnsavedChangesBar } from '@/components/ui'
import logoLigo from '@/assets/images/logo-ligo.svg'

type LigoMode = 'aggregator' | 'propio'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()
const GATEWAY_CODE = 'ligo-qr'

const webhookUrl = computed(() => (store.currentConfig as any)?.webhook_url || null)

const formData = reactive({
  mode: 'aggregator' as LigoMode,
  environment: 'prueba' as 'produccion' | 'prueba',
  username: '',
  password: '',
  company_id: '',
  account_id: '',
  merchant_code: '',
  sis_origen: '',
  private_key: '',
})

const initialMode = ref<LigoMode>('aggregator')
const hasStored = reactive({ password: false, private_key: false })

const { isDirty, reset: resetDirty } = useDirtyForm(() => formData)

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

async function loadOwnCredentials() {
  try {
    const res = await paymentGatewaysApi.getLigoCredentials()
    const c = (res as any)?.data
    if (c) {
      formData.username = c.username ?? ''
      formData.company_id = c.company_id ?? ''
      formData.account_id = c.account_id ?? ''
      formData.merchant_code = c.merchant_code ?? ''
      formData.sis_origen = c.sis_origen ?? ''
      hasStored.password = !!c.has_password
      hasStored.private_key = !!c.has_private_key
    }
  } catch {
    // silencioso: sin credenciales propias todavía
  } finally {
    resetDirty()
  }
}

watch(() => store.currentConfig, (config) => {
  if (!config?.gateway) {
    formData.mode = 'aggregator'
    formData.environment = 'prueba'
    initialMode.value = 'aggregator'
    resetDirty()
    return
  }

  const c = (config.credentials || {}) as Record<string, any>
  const detected: LigoMode = (c.mode as LigoMode) === 'propio' ? 'propio' : 'aggregator'
  initialMode.value = detected
  formData.mode = detected
  formData.environment = (c.environment as 'produccion' | 'prueba') ?? 'prueba'
  if (detected === 'propio') {
    loadOwnCredentials()
  } else {
    resetDirty()
  }
}, { immediate: true })

onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  if (formData.mode === 'propio') {
    if (!formData.username || !formData.company_id || !formData.account_id) {
      toast.add({ severity: 'warn', summary: 'Datos requeridos', detail: 'Usuario, Company ID e ID de cuenta son obligatorios.', life: 4000 })
      return
    }
    if (!hasStored.password && !formData.password) {
      toast.add({ severity: 'warn', summary: 'Contraseña requerida', detail: 'Ingresa la contraseña de Ligo.', life: 4000 })
      return
    }
    if (!hasStored.private_key && !formData.private_key) {
      toast.add({ severity: 'warn', summary: 'Clave privada requerida', detail: 'Ingresa la clave privada RSA de Ligo.', life: 4000 })
      return
    }
  }

  // 1. Guarda el toggle mode/environment en tiendaspasarelas (valor1/valor2).
  const credentialsPayload: Record<string, any> = {
    mode: formData.mode,
    environment: formData.environment,
  }
  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, { credentials: credentialsPayload, environment: formData.environment, enabled: true })
    : await store.saveCredentials(GATEWAY_CODE, { credentials: credentialsPayload, environment: formData.environment, enabled: true })

  if (!result.success) {
    toast.add({ severity: 'error', summary: 'Error', life: 3000 })
    return
  }

  // 2. En modo propio, guarda las credenciales pesadas en su tabla dedicada.
  if (formData.mode === 'propio') {
    const payload: Record<string, any> = {
      environment: formData.environment,
      username: formData.username,
      company_id: formData.company_id,
      account_id: formData.account_id,
      merchant_code: formData.merchant_code,
      sis_origen: formData.sis_origen,
      activo: true,
    }
    if (formData.password) payload.password = formData.password
    if (formData.private_key) payload.private_key = formData.private_key

    const credRes = await paymentGatewaysApi.saveLigoCredentials(payload)
    if (!(credRes as any)?.success && (credRes as any)?.error !== 0) {
      // El backend responde { error: 0 } en éxito.
    }
    hasStored.password = hasStored.password || !!formData.password
    hasStored.private_key = hasStored.private_key || !!formData.private_key
    formData.password = ''
    formData.private_key = ''
  }

  toast.add({ severity: 'success', summary: 'Éxito', life: 3000 })
  initialMode.value = formData.mode
  resetDirty()
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

function openLigo() {
  window.open('https://www.ligopays.com/', '_blank')
}
</script>
