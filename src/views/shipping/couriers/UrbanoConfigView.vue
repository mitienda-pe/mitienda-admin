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
      <img :src="urbanoLogo" alt="Urbano" class="w-10 h-10 object-contain" />
      <div>
        <h1 class="text-2xl font-bold text-secondary">Urbano</h1>
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
          <!-- API Key -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">API Key (x-api-key)</label>
            <Password
              v-model="form.api_key"
              class="w-full"
              :feedback="false"
              toggleMask
              placeholder="Ingresa tu token SHA de Urbano"
              inputClass="w-full"
            />
          </div>

          <!-- Contrato & Seller -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Contrato (ID Servicio)</label>
              <InputText v-model="form.contrato" class="w-full" placeholder="Ej: 25" />
              <small class="text-secondary-400">Proporcionado por Urbano</small>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Seller ID</label>
              <InputText v-model="form.seller_id" class="w-full" placeholder="Ej: LB-AQP" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre del Seller / Tienda</label>
            <InputText v-model="form.seller_name" class="w-full" placeholder="Nombre de tu tienda en Urbano" />
          </div>

          <!-- Environment -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Entorno</label>
            <SelectButton
              v-model="form.environment"
              :options="environmentOptions"
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
              <label class="block text-sm font-medium text-secondary-700 mb-1">Teléfono</label>
              <InputText v-model="form.sender_phone" class="w-full" placeholder="999999999" />
            </div>
          </div>

          <Divider />

          <!-- Origin Address -->
          <h3 class="text-lg font-semibold text-secondary-700">Dirección de origen</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-1">Dirección</label>
              <InputText v-model="form.origin_address" class="w-full" placeholder="Av. Ejemplo 123, Lima" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Ubigeo</label>
              <InputText v-model="form.origin_ubigeo" class="w-full" placeholder="150101" />
              <small class="text-secondary-400">Código de 6 dígitos</small>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Región / Departamento</label>
              <InputText v-model="form.origin_region" class="w-full" placeholder="LIMA" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Provincia</label>
              <InputText v-model="form.origin_provincia" class="w-full" placeholder="LIMA" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Ciudad / Distrito</label>
              <InputText v-model="form.origin_ciudad" class="w-full" placeholder="SANTIAGO DE SURCO" />
            </div>
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
              <label class="block text-sm font-medium text-secondary-700 mb-1">Ubigeo destino</label>
              <InputText v-model="simDestUbigeo" class="w-full" placeholder="150125" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Peso (kg)</label>
              <InputText v-model="simPeso" class="w-full" placeholder="2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Alto (cm)</label>
              <InputText v-model="simAlto" class="w-full" placeholder="14" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Largo (cm)</label>
              <InputText v-model="simLargo" class="w-full" placeholder="25" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Ancho (cm)</label>
              <InputText v-model="simAncho" class="w-full" placeholder="23" />
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
          <h3 class="text-lg font-semibold text-secondary-700 mb-3">Sobre Urbano</h3>
          <p class="text-sm text-secondary-500 mb-4">
            Urbano es un servicio de courier y logística para envíos a nivel nacional
            en el Perú. Ofrece distribución terrestre y aérea, logística inversa,
            puntos de recojo y entrega (Puntos Urbano).
          </p>
          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Pasos para configurar</h4>
          <ol class="text-sm text-secondary-500 space-y-2 list-decimal list-inside">
            <li>Crea una cuenta en Urbano Express</li>
            <li>Solicita acceso a la API V3 desde el portal</li>
            <li>Obtén tu token (x-api-key) y número de contrato</li>
            <li>Ingresa las credenciales en esta configuración</li>
            <li>Configura los datos de remitente y dirección de origen</li>
          </ol>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Servicios disponibles</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Distribución:</strong> Envíos terrestre a nivel nacional</li>
            <li><strong>Vía Aérea:</strong> Envíos aéreos (Prime/Estándar)</li>
            <li><strong>Log. Inversa:</strong> Retiro de productos (C2B/B2B)</li>
            <li><strong>Puntos Urbano:</strong> Entrega y recojo en tiendas</li>
          </ul>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Cobertura</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Nacional:</strong> Todo el Perú</li>
            <li><strong>Aéreo:</strong> Ciudades principales</li>
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
import urbanoLogo from '@/assets/images/logo-urbano.png'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import SelectButton from 'primevue/selectbutton'
import Divider from 'primevue/divider'

const router = useRouter()
const store = useCourierProvidersStore()
const toast = useToast()

const environmentOptions = [
  { label: 'Producción', value: 'produccion' },
  { label: 'Prueba (Sandbox)', value: 'prueba' },
]

const form = ref({
  api_key: '',
  contrato: '',
  seller_id: '',
  seller_name: '',
  sender_name: '',
  sender_phone: '',
  origin_address: '',
  origin_ubigeo: '',
  origin_region: '',
  origin_provincia: '',
  origin_ciudad: '',
  environment: 'produccion',
})

// Simulator
const simDestUbigeo = ref('')
const simPeso = ref('')
const simAlto = ref('')
const simLargo = ref('')
const simAncho = ref('')
const isSimulating = ref(false)
const simResult = ref<unknown>(null)

const isConfigured = computed(() => store.currentConfig?.courier?.configured ?? false)

// Populate form when config loads
watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials
    form.value.api_key = (c.api_key as string) || ''
    form.value.contrato = (c.contrato as string) || ''
    form.value.seller_id = (c.seller_id as string) || ''
    form.value.seller_name = (c.seller_name as string) || ''
    form.value.sender_name = (c.sender_name as string) || ''
    form.value.sender_phone = (c.sender_phone as string) || ''
    form.value.origin_address = (c.origin_address as string) || ''
    form.value.origin_ubigeo = (c.origin_ubigeo as string) || ''
    form.value.origin_region = (c.origin_region as string) || ''
    form.value.origin_provincia = (c.origin_provincia as string) || ''
    form.value.origin_ciudad = (c.origin_ciudad as string) || ''
    form.value.environment = (c.environment as string) || 'produccion'
  }
}, { immediate: true })

async function handleSave() {
  if (!form.value.api_key.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'API Key es obligatoria', life: 3000 })
    return
  }

  const credentials = { ...form.value }

  try {
    if (isConfigured.value) {
      await store.updateConfig('urbano', { credentials })
    } else {
      await store.saveConfig('urbano', { credentials })
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
    await store.deleteConfig('urbano')
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
  if (!simDestUbigeo.value) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Ingresa el ubigeo de destino', life: 3000 })
    return
  }

  try {
    isSimulating.value = true
    simResult.value = await store.calculatePrice('urbano', {
      origin: {
        ubigeo: form.value.origin_ubigeo,
      },
      destination: {
        ubigeo: simDestUbigeo.value,
      },
      peso: parseFloat(simPeso.value) || 1,
      alto: parseInt(simAlto.value) || 10,
      largo: parseInt(simLargo.value) || 10,
      ancho: parseInt(simAncho.value) || 10,
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
