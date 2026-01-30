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
      <img :src="chazkiLogo" alt="Chazki" class="w-10 h-10 object-contain" />
      <div>
        <h1 class="text-2xl font-bold text-secondary">Chazki</h1>
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
          <!-- Enterprise Key -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Enterprise Key</label>
            <Password
              v-model="form.enterprise_key"
              class="w-full"
              :feedback="false"
              toggleMask
              placeholder="Ingresa tu Enterprise Key de Chazki"
              inputClass="w-full"
            />
          </div>

          <!-- Store ID & Branch ID -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Store ID</label>
              <InputText v-model="form.store_id" class="w-full" placeholder="ID de tienda en Chazki" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Branch ID</label>
              <InputText v-model="form.branch_id" class="w-full" placeholder="ID de sucursal en Chazki" />
            </div>
          </div>

          <Divider />

          <!-- Services -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Servicios habilitados</label>
            <div class="flex flex-wrap gap-4">
              <div v-for="svc in availableServices" :key="svc.id" class="flex items-center gap-2">
                <Checkbox
                  v-model="selectedServiceIds"
                  :value="svc.id"
                  :inputId="`svc-chazki-${svc.id}`"
                />
                <label :for="`svc-chazki-${svc.id}`" class="text-sm text-secondary-700">{{ svc.name }}</label>
              </div>
            </div>
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
              <label class="block text-sm font-medium text-secondary-700 mb-1">Distrito</label>
              <InputText v-model="form.origin_district" class="w-full" placeholder="San Borja" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Referencia</label>
              <InputText v-model="form.origin_reference" class="w-full" placeholder="Frente al parque" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Latitud</label>
              <InputText v-model="form.origin_latitude" class="w-full" placeholder="-12.0464" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Longitud</label>
              <InputText v-model="form.origin_longitude" class="w-full" placeholder="-77.0428" />
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

        <!-- Coverage Check -->
        <div class="bg-white rounded-lg shadow p-6 mt-6" v-if="isConfigured">
          <h3 class="text-lg font-semibold text-secondary-700 mb-4">Verificar Cobertura</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Latitud destino</label>
              <InputText v-model="simDestLat" class="w-full" placeholder="-12.1200" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Longitud destino</label>
              <InputText v-model="simDestLng" class="w-full" placeholder="-77.0300" />
            </div>
          </div>
          <Button
            label="Verificar Cobertura"
            icon="pi pi-map"
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
          <h3 class="text-lg font-semibold text-secondary-700 mb-3">Sobre Chazki</h3>
          <p class="text-sm text-secondary-500 mb-4">
            Chazki es un servicio de courier para envíos Regular, Express y Programado
            en Lima y ciudades principales del Perú.
          </p>
          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Pasos para configurar</h4>
          <ol class="text-sm text-secondary-500 space-y-2 list-decimal list-inside">
            <li>Crea una cuenta en Chazki</li>
            <li>Obtén tu Enterprise Key desde el panel de integraciones</li>
            <li>Obtén el Store ID y Branch ID de tu cuenta</li>
            <li>Ingresa las credenciales en esta configuración</li>
            <li>Selecciona los servicios disponibles</li>
            <li>Ingresa los datos de remitente y dirección de origen</li>
          </ol>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Servicios disponibles</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Regular:</strong> Entrega al día siguiente</li>
            <li><strong>Express:</strong> Entrega en ~3 horas</li>
            <li><strong>Programado:</strong> Entrega en horario específico</li>
          </ul>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Horarios programados</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li>9:00 - 13:00</li>
            <li>13:00 - 17:00</li>
            <li>17:00 - 21:00</li>
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
import chazkiLogo from '@/assets/images/logo-chazki.webp'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'

const router = useRouter()
const store = useCourierProvidersStore()
const toast = useToast()

const availableServices = [
  { id: 1, name: 'Regular' },
  { id: 2, name: 'Express' },
  { id: 3, name: 'Programado' },
]

const form = ref({
  enterprise_key: '',
  store_id: '',
  branch_id: '',
  sender_name: '',
  sender_email: '',
  sender_phone: '',
  origin_address: '',
  origin_district: '',
  origin_reference: '',
  origin_latitude: '',
  origin_longitude: '',
})

const selectedServiceIds = ref<number[]>([1, 2, 3])

// Simulator
const simDestLat = ref('')
const simDestLng = ref('')
const isSimulating = ref(false)
const simResult = ref<unknown>(null)

const isConfigured = computed(() => store.currentConfig?.courier?.configured ?? false)

// Populate form when config loads
watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials
    form.value.enterprise_key = (c.enterprise_key as string) || ''
    form.value.store_id = (c.store_id as string) || ''
    form.value.branch_id = (c.branch_id as string) || ''
    form.value.sender_name = (c.sender_name as string) || ''
    form.value.sender_email = (c.sender_email as string) || ''
    form.value.sender_phone = (c.sender_phone as string) || ''
    form.value.origin_address = (c.origin_address as string) || ''
    form.value.origin_district = (c.origin_district as string) || ''
    form.value.origin_reference = (c.origin_reference as string) || ''
    form.value.origin_latitude = (c.origin_latitude as string) || ''
    form.value.origin_longitude = (c.origin_longitude as string) || ''

    try {
      const servicesData = JSON.parse((c.services as string) || '{}')
      if (servicesData.servicios) {
        selectedServiceIds.value = servicesData.servicios
          .filter((s: { estado: string | number }) => s.estado === '1' || s.estado === 1)
          .map((s: { id: number | string }) => Number(s.id))
      }
    } catch {
      selectedServiceIds.value = [1, 2, 3]
    }
  }
}, { immediate: true })

function buildServicesJson(): string {
  const servicios = availableServices.map((svc) => ({
    id: svc.id,
    tipo: svc.name.toUpperCase(),
    estado: selectedServiceIds.value.includes(svc.id) ? '1' : '0',
  }))
  return JSON.stringify({ servicios })
}

async function handleSave() {
  if (!form.value.enterprise_key.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Enterprise Key es obligatoria', life: 3000 })
    return
  }

  const credentials = {
    ...form.value,
    services: buildServicesJson(),
  }

  try {
    if (isConfigured.value) {
      await store.updateConfig('chazki', { credentials })
    } else {
      await store.saveConfig('chazki', { credentials })
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
    await store.deleteConfig('chazki')
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
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Ingresa coordenadas de destino', life: 3000 })
    return
  }

  try {
    isSimulating.value = true
    simResult.value = await store.calculatePrice('chazki', {
      origin: {
        lat: parseFloat(form.value.origin_latitude),
        lng: parseFloat(form.value.origin_longitude),
      },
      destination: {
        lat: parseFloat(simDestLat.value),
        lng: parseFloat(simDestLng.value),
      },
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al verificar cobertura',
      life: 5000,
    })
  } finally {
    isSimulating.value = false
  }
}
</script>
