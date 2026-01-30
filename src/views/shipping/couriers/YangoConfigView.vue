<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="router.push('/shipping/couriers')"
      />
      <img :src="yangoLogo" alt="Yango" class="w-10 h-10 object-contain" />
      <div>
        <h1 class="text-2xl font-bold text-secondary">Yango Delivery</h1>
        <p class="text-sm text-secondary-400 mt-1">Configuración de credenciales y servicios</p>
      </div>
    </div>

    <!-- Status Banner -->
    <div
      v-if="store.currentConfig"
      class="rounded-lg p-4 mb-6 flex items-center gap-3"
      :class="isConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'"
    >
      <i
        class="pi text-lg"
        :class="isConfigured ? 'pi-check-circle text-green-600' : 'pi-info-circle text-yellow-600'"
      ></i>
      <span :class="isConfigured ? 'text-green-700' : 'text-yellow-700'">
        {{ isConfigured ? 'Courier configurado y activo' : 'Courier sin configurar — completa los campos para activarlo' }}
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Form -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow p-6 space-y-6">
          <!-- API Token -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Token de API (Bearer)</label>
            <Password
              v-model="form.api_token"
              class="w-full"
              :feedback="false"
              toggleMask
              placeholder="Token OAuth de Yango Delivery"
              inputClass="w-full"
            />
            <small class="text-secondary-400">Se obtiene desde el portal de integración de Yango</small>
          </div>

          <!-- Taxi Class -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Tipo de servicio por defecto</label>
            <SelectButton
              v-model="form.taxi_class"
              :options="taxiClassOptions"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
            />
          </div>

          <Divider />

          <!-- Sender Info -->
          <h3 class="text-lg font-semibold text-secondary-700">Datos del remitente</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre</label>
              <InputText v-model="form.sender_name" class="w-full" placeholder="Nombre del remitente" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Email</label>
              <InputText v-model="form.sender_email" class="w-full" placeholder="email@ejemplo.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Teléfono</label>
              <InputText v-model="form.sender_phone" class="w-full" placeholder="+51999999999" />
              <small class="text-secondary-400">Con código de país</small>
            </div>
          </div>

          <Divider />

          <!-- Origin Address -->
          <h3 class="text-lg font-semibold text-secondary-700">Dirección de origen</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-1">Dirección completa</label>
              <InputText v-model="form.origin_address" class="w-full" placeholder="Av. Ejemplo 123, Lima" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Latitud</label>
              <InputText v-model="form.origin_latitude" class="w-full" placeholder="-12.0464" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Longitud</label>
              <InputText v-model="form.origin_longitude" class="w-full" placeholder="-77.0428" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-1">Comentario / Referencia</label>
              <InputText v-model="form.origin_comment" class="w-full" placeholder="Portón azul, segundo piso" />
            </div>
          </div>

          <Divider />

          <!-- Callback URL (optional) -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Callback URL (opcional)</label>
            <InputText v-model="form.callback_url" class="w-full" placeholder="https://tu-sitio.com/webhook/yango" />
            <small class="text-secondary-400">URL para recibir notificaciones de cambio de estado</small>
          </div>

          <Divider />

          <!-- Actions -->
          <div class="flex justify-between">
            <Button
              v-if="isConfigured"
              label="Eliminar Configuración"
              icon="pi pi-trash"
              severity="danger"
              text
              :loading="store.isSaving"
              @click="handleDelete"
            />
            <div class="flex gap-2 ml-auto">
              <Button
                label="Cancelar"
                text
                severity="secondary"
                @click="router.push('/shipping/couriers')"
              />
              <Button
                :label="isConfigured ? 'Actualizar' : 'Guardar'"
                icon="pi pi-save"
                :loading="store.isSaving"
                @click="handleSave"
              />
            </div>
          </div>
        </div>

        <!-- Quote Test -->
        <div class="bg-white rounded-lg shadow p-6 mt-6" v-if="isConfigured">
          <h3 class="text-lg font-semibold text-secondary-700 mb-4">Cotizar Envío</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Dirección destino</label>
              <InputText v-model="simDestAddress" class="w-full" placeholder="Av. Destino 456, Lima" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Latitud destino</label>
              <InputText v-model="simDestLat" class="w-full" placeholder="-12.1200" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Longitud destino</label>
              <InputText v-model="simDestLng" class="w-full" placeholder="-77.0300" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo de servicio</label>
              <SelectButton
                v-model="simTaxiClass"
                :options="taxiClassOptions"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
              />
            </div>
          </div>
          <Button
            label="Cotizar"
            icon="pi pi-calculator"
            :loading="isSimulating"
            @click="handleSimulate"
          />
          <div v-if="simResult" class="mt-4 p-4 bg-secondary-50 rounded-lg">
            <pre class="text-sm text-secondary-700 whitespace-pre-wrap">{{ JSON.stringify(simResult, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-secondary-700 mb-3">Sobre Yango Delivery</h3>
          <p class="text-sm text-secondary-500 mb-4">
            Yango Delivery es una plataforma de delivery express que conecta negocios
            con una red de couriers para entregas rápidas dentro de la ciudad.
          </p>
          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Pasos para configurar</h4>
          <ol class="text-sm text-secondary-500 space-y-2 list-decimal list-inside">
            <li>Crea una cuenta corporativa en Yango Delivery</li>
            <li>Accede a la sección de Integración en tu cuenta</li>
            <li>Genera tu token de API (Bearer token)</li>
            <li>Ingresa el token y datos de remitente aquí</li>
            <li>Configura las coordenadas de tu dirección de origen</li>
          </ol>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Tipos de servicio</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Courier:</strong> Entrega express en moto/bicicleta</li>
            <li><strong>Express:</strong> Entrega rápida en auto</li>
            <li><strong>Cargo:</strong> Envíos de mayor tamaño en camioneta</li>
          </ul>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Características</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Tracking:</strong> Seguimiento en tiempo real</li>
            <li><strong>Multi-punto:</strong> Entregas con varias paradas</li>
            <li><strong>Same-day:</strong> Entrega el mismo día</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCourierProvidersStore } from '@/stores/courier-providers.store'
import { useToast } from 'primevue/usetoast'
import yangoLogo from '@/assets/images/logo-yango.svg'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import SelectButton from 'primevue/selectbutton'
import Divider from 'primevue/divider'

const router = useRouter()
const store = useCourierProvidersStore()
const toast = useToast()

const taxiClassOptions = [
  { label: 'Courier', value: 'courier' },
  { label: 'Express', value: 'express' },
  { label: 'Cargo', value: 'cargo' },
]

const form = ref({
  api_token: '',
  taxi_class: 'courier',
  sender_name: '',
  sender_email: '',
  sender_phone: '',
  origin_address: '',
  origin_latitude: '',
  origin_longitude: '',
  origin_comment: '',
  callback_url: '',
})

// Simulator
const simDestAddress = ref('')
const simDestLat = ref('')
const simDestLng = ref('')
const simTaxiClass = ref('courier')
const isSimulating = ref(false)
const simResult = ref<unknown>(null)

const isConfigured = computed(() => store.currentConfig?.courier?.configured ?? false)

// Populate form when config loads
watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials
    form.value.api_token = (c.api_token as string) || ''
    form.value.taxi_class = (c.taxi_class as string) || 'courier'
    form.value.sender_name = (c.sender_name as string) || ''
    form.value.sender_email = (c.sender_email as string) || ''
    form.value.sender_phone = (c.sender_phone as string) || ''
    form.value.origin_address = (c.origin_address as string) || ''
    form.value.origin_latitude = (c.origin_latitude as string) || ''
    form.value.origin_longitude = (c.origin_longitude as string) || ''
    form.value.origin_comment = (c.origin_comment as string) || ''
    form.value.callback_url = (c.callback_url as string) || ''
  }
}, { immediate: true })

async function handleSave() {
  if (!form.value.api_token.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'El token de API es obligatorio', life: 3000 })
    return
  }

  const credentials = { ...form.value }

  try {
    if (isConfigured.value) {
      await store.updateConfig('yango', { credentials })
    } else {
      await store.saveConfig('yango', { credentials })
    }
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración guardada correctamente', life: 3000 })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al guardar configuración',
      life: 5000,
    })
  }
}

async function handleDelete() {
  try {
    await store.deleteConfig('yango')
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Configuración eliminada', life: 3000 })
    router.push('/shipping/couriers')
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al eliminar',
      life: 5000,
    })
  }
}

async function handleSimulate() {
  if (!simDestLat.value || !simDestLng.value) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Ingresa las coordenadas de destino', life: 3000 })
    return
  }

  try {
    isSimulating.value = true
    simResult.value = await store.calculatePrice('yango', {
      origin: {
        lat: parseFloat(form.value.origin_latitude) || 0,
        lng: parseFloat(form.value.origin_longitude) || 0,
        address: form.value.origin_address,
      },
      destination: {
        lat: parseFloat(simDestLat.value) || 0,
        lng: parseFloat(simDestLng.value) || 0,
        address: simDestAddress.value,
      },
      taxi_class: simTaxiClass.value,
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al cotizar envío',
      life: 5000,
    })
  } finally {
    isSimulating.value = false
  }
}
</script>
