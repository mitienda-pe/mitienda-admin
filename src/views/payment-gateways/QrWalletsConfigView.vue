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
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Numero de telefono</label>
                  <InputText v-model="formData.yape_business_id" placeholder="999 999 999" class="w-full" />
                  <small class="text-secondary-500">El numero asociado a tu cuenta Yape</small>
                </div>

                <!-- QR Image Upload -->
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Imagen del codigo QR</label>
                  <div v-if="yapeQrPreview || formData.yape_qr_url" class="mb-3">
                    <img :src="yapeQrPreview || formData.yape_qr_url" alt="QR Yape" class="w-48 h-48 object-contain border rounded-lg bg-white p-2" />
                    <button type="button" class="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center gap-1" @click="removeYapeQr">
                      <i class="pi pi-trash text-xs"></i> Eliminar imagen
                    </button>
                  </div>
                  <div v-else class="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer" @click="triggerYapeUpload" @dragover.prevent @drop.prevent="handleYapeDrop">
                    <i class="pi pi-image text-3xl text-secondary-400 mb-2"></i>
                    <p class="text-sm text-secondary-600">Arrastra tu imagen QR aqui o <span class="text-primary font-medium">haz clic para seleccionar</span></p>
                    <p class="text-xs text-secondary-400 mt-1">PNG, JPG o WebP. Max 2MB</p>
                  </div>
                  <input ref="yapeFileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleYapeFile" />
                  <small class="text-secondary-500 mt-1 block">Descarga tu QR desde la app Yape y subelo aqui</small>
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
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Numero de telefono</label>
                  <InputText v-model="formData.plin_business_id" placeholder="999 999 999" class="w-full" />
                  <small class="text-secondary-500">El numero asociado a tu cuenta Plin</small>
                </div>

                <!-- QR Image Upload -->
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Imagen del codigo QR</label>
                  <div v-if="plinQrPreview || formData.plin_qr_url" class="mb-3">
                    <img :src="plinQrPreview || formData.plin_qr_url" alt="QR Plin" class="w-48 h-48 object-contain border rounded-lg bg-white p-2" />
                    <button type="button" class="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center gap-1" @click="removePlinQr">
                      <i class="pi pi-trash text-xs"></i> Eliminar imagen
                    </button>
                  </div>
                  <div v-else class="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer" @click="triggerPlinUpload" @dragover.prevent @drop.prevent="handlePlinDrop">
                    <i class="pi pi-image text-3xl text-secondary-400 mb-2"></i>
                    <p class="text-sm text-secondary-600">Arrastra tu imagen QR aqui o <span class="text-primary font-medium">haz clic para seleccionar</span></p>
                    <p class="text-xs text-secondary-400 mt-1">PNG, JPG o WebP. Max 2MB</p>
                  </div>
                  <input ref="plinFileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handlePlinFile" />
                  <small class="text-secondary-500 mt-1 block">Descarga tu QR desde la app de tu banco y subelo aqui</small>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Instrucciones -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">Instrucciones para el cliente (opcional)</label>
              <Textarea
                v-model="formData.instructions"
                placeholder="Instrucciones que vera el cliente al elegir este metodo de pago..."
                rows="3"
                class="w-full"
              />
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>
            <Message v-if="uploadError" severity="error" :closable="true" @close="uploadError = ''">{{ uploadError }}</Message>

            <div class="flex gap-3 pt-4">
              <Button type="submit" :label="isConfigured ? 'Actualizar' : 'Guardar'" icon="pi pi-save" :loading="store.isSaving || isUploading" />
              <Button v-if="isConfigured" type="button" label="Eliminar" icon="pi pi-trash" severity="danger" outlined @click="handleDelete" />
            </div>
          </form>
        </template>
      </Card>
    </div>

    <div>
      <Card>
        <template #title><div class="flex items-center gap-2"><i class="pi pi-info-circle"></i><span>Informacion</span></div></template>
        <template #content>
          <div class="space-y-4 text-sm">
            <p class="text-secondary-600">
              Permite a tus clientes pagar escaneando un codigo QR con Yape o Plin.
            </p>
            <Divider />
            <div>
              <h4 class="font-semibold mb-2">Como funciona</h4>
              <ol class="list-decimal list-inside text-secondary-600 space-y-1">
                <li>Sube tu codigo QR desde la app</li>
                <li>El cliente lo escanea al hacer su pedido</li>
                <li>Realiza el pago desde su app</li>
                <li>Tu confirmas el pago manualmente</li>
              </ol>
            </div>
            <Divider />
            <div>
              <h4 class="font-semibold mb-2">Como obtener tu QR</h4>
              <ul class="list-disc list-inside text-secondary-600 space-y-1">
                <li><strong>Yape:</strong> App Yape > Mi codigo QR > Guardar imagen</li>
                <li><strong>Plin:</strong> App de tu banco > Plin > Compartir QR > Guardar</li>
              </ul>
            </div>
            <Divider />
            <div class="bg-yellow-50 p-3 rounded-lg">
              <p class="text-yellow-800 text-xs">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                Los pagos con QR requieren confirmacion manual.
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import { paymentGatewaysApi } from '@/api/payment-gateways.api'
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

// File upload state
const yapeFileInput = ref<HTMLInputElement | null>(null)
const plinFileInput = ref<HTMLInputElement | null>(null)
const yapeQrFile = ref<File | null>(null)
const plinQrFile = ref<File | null>(null)
const yapeQrPreview = ref<string>('')
const plinQrPreview = ref<string>('')
const isUploading = ref(false)
const uploadError = ref('')

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials as Record<string, any>
    formData.yape_enabled = c.yape_enabled ?? false
    formData.yape_business_id = c.yape_business_id ?? ''
    formData.yape_qr_url = c.yape_qr_url ?? ''
    formData.plin_enabled = c.plin_enabled ?? false
    formData.plin_business_id = c.plin_business_id ?? ''
    formData.plin_qr_url = c.plin_qr_url ?? ''
    formData.instructions = c.instructions ?? ''
  }
}, { immediate: true })

onMounted(() => { store.clearMessages() })

// --- Yape file handlers ---
function triggerYapeUpload() {
  yapeFileInput.value?.click()
}

function handleYapeFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) setYapeFile(file)
}

function handleYapeDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) setYapeFile(file)
}

function setYapeFile(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = 'La imagen no debe superar 2MB'
    return
  }
  yapeQrFile.value = file
  yapeQrPreview.value = URL.createObjectURL(file)
  uploadError.value = ''
}

function removeYapeQr() {
  yapeQrFile.value = null
  yapeQrPreview.value = ''
  formData.yape_qr_url = ''
  if (yapeFileInput.value) yapeFileInput.value.value = ''
}

// --- Plin file handlers ---
function triggerPlinUpload() {
  plinFileInput.value?.click()
}

function handlePlinFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) setPlinFile(file)
}

function handlePlinDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) setPlinFile(file)
}

function setPlinFile(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = 'La imagen no debe superar 2MB'
    return
  }
  plinQrFile.value = file
  plinQrPreview.value = URL.createObjectURL(file)
  uploadError.value = ''
}

function removePlinQr() {
  plinQrFile.value = null
  plinQrPreview.value = ''
  formData.plin_qr_url = ''
  if (plinFileInput.value) plinFileInput.value.value = ''
}

// --- Submit ---
async function handleSubmit() {
  if (!formData.yape_enabled && !formData.plin_enabled) {
    toast.add({ severity: 'warn', summary: 'Habilita al menos una billetera', life: 3000 })
    return
  }

  isUploading.value = true
  uploadError.value = ''

  try {
    // Upload QR images if new files were selected
    if (yapeQrFile.value) {
      const result = await paymentGatewaysApi.uploadQrImage('yape', yapeQrFile.value)
      if (result.success && result.data) {
        formData.yape_qr_url = result.data.qr_url
        yapeQrFile.value = null
        yapeQrPreview.value = ''
      }
    }

    if (plinQrFile.value) {
      const result = await paymentGatewaysApi.uploadQrImage('plin', plinQrFile.value)
      if (result.success && result.data) {
        formData.plin_qr_url = result.data.qr_url
        plinQrFile.value = null
        plinQrPreview.value = ''
      }
    }

    // Save/update gateway config
    const result = isConfigured.value
      ? await store.updateCredentials(GATEWAY_CODE, { credentials: formData, environment: 'produccion', enabled: true })
      : await store.saveCredentials(GATEWAY_CODE, { credentials: formData, environment: 'produccion', enabled: true })

    toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Configuracion guardada' : 'Error', life: 3000 })
  } catch (err) {
    uploadError.value = 'Error al subir la imagen. Intenta de nuevo.'
    console.error('QR upload error:', err)
  } finally {
    isUploading.value = false
  }
}

function handleDelete() {
  confirm.require({
    message: 'Se eliminara la configuracion de Yape y Plin.', header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      if (result.success) {
        removeYapeQr()
        removePlinQr()
      }
      toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Eliminadas' : 'Error', life: 3000 })
    }
  })
}
</script>
