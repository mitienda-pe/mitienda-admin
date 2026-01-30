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
      <div>
        <h1 class="text-2xl font-bold text-secondary">99 Minutos</h1>
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
            <label class="block text-sm font-medium text-secondary-700 mb-1">API Key</label>
            <Password
              v-model="form.api_key"
              class="w-full"
              :feedback="false"
              toggleMask
              placeholder="Ingresa tu API Key de 99 Minutos"
              inputClass="w-full"
            />
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

          <!-- Services -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Servicios habilitados</label>
            <div class="flex flex-wrap gap-4">
              <div v-for="svc in availableServices" :key="svc.id" class="flex items-center gap-2">
                <Checkbox
                  v-model="selectedServiceIds"
                  :value="svc.id"
                  :inputId="`svc99-${svc.id}`"
                />
                <label :for="`svc99-${svc.id}`" class="text-sm text-secondary-700">{{ svc.name }}</label>
              </div>
            </div>
          </div>

          <Divider />

          <!-- Company -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre de empresa / cuenta</label>
            <InputText v-model="form.company_name" class="w-full" placeholder="Mi Tienda S.A.C." />
          </div>

          <!-- Sender Info -->
          <h3 class="text-lg font-semibold text-secondary-700">Datos del remitente</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre</label>
              <InputText v-model="form.sender_first_name" class="w-full" placeholder="Nombre" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Apellido</label>
              <InputText v-model="form.sender_last_name" class="w-full" placeholder="Apellido" />
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
              <label class="block text-sm font-medium text-secondary-700 mb-1">Interior / Piso</label>
              <InputText v-model="form.origin_interior" class="w-full" placeholder="Piso 2, Oficina 201" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">País</label>
              <Dropdown
                v-model="form.country"
                :options="countryOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
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

        <!-- Price Simulator -->
        <div class="bg-white rounded-lg shadow p-6 mt-6" v-if="isConfigured">
          <h3 class="text-lg font-semibold text-secondary-700 mb-4">Simulador de Precio</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Dirección origen</label>
              <InputText v-model="simOrigin" class="w-full" placeholder="Av. Javier Prado 123, Lima" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Dirección destino</label>
              <InputText v-model="simDestination" class="w-full" placeholder="Calle Los Olivos 456, Lima" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Peso (kg)</label>
              <InputText v-model="simWeight" class="w-full" placeholder="1" />
            </div>
          </div>
          <Button
            label="Calcular Precio"
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
          <h3 class="text-lg font-semibold text-secondary-700 mb-3">Sobre 99 Minutos</h3>
          <p class="text-sm text-secondary-500 mb-4">
            99 Minutos es una plataforma de logística que ofrece servicios de entrega
            Same Day y Next Day en Perú y Latinoamérica.
          </p>
          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Pasos para configurar</h4>
          <ol class="text-sm text-secondary-500 space-y-2 list-decimal list-inside">
            <li>Crea una cuenta en 99 Minutos</li>
            <li>Obtén tu API Key desde el panel</li>
            <li>Ingresa la API Key en esta configuración</li>
            <li>Selecciona los servicios disponibles</li>
            <li>Ingresa los datos de remitente y dirección</li>
          </ol>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Servicios</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Same Day:</strong> Entrega el mismo día</li>
            <li><strong>Next Day:</strong> Entrega al día siguiente</li>
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
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import SelectButton from 'primevue/selectbutton'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Divider from 'primevue/divider'

const router = useRouter()
const store = useCourierProvidersStore()
const toast = useToast()

const environmentOptions = [
  { label: 'Producción', value: 'produccion' },
  { label: 'Prueba (Sandbox)', value: 'prueba' },
]

const availableServices = [
  { id: 1, name: 'Same Day' },
  { id: 2, name: 'Next Day' },
]

const countryOptions = [
  { label: 'Perú', value: 'PER' },
  { label: 'Ecuador', value: 'ECU' },
]

const form = ref({
  api_key: '',
  environment: 'produccion',
  sender_first_name: '',
  sender_last_name: '',
  sender_email: '',
  sender_phone: '',
  origin_address: '',
  origin_interior: '',
  country: 'PER',
  company_name: '',
})

const selectedServiceIds = ref<number[]>([1, 2])

// Simulator
const simOrigin = ref('')
const simDestination = ref('')
const simWeight = ref('1')
const isSimulating = ref(false)
const simResult = ref<unknown>(null)

const isConfigured = computed(() => store.currentConfig?.courier?.configured ?? false)

// Populate form when config loads
watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials
    form.value.api_key = (c.api_key as string) || ''
    form.value.environment = (c.environment as string) || 'produccion'
    form.value.sender_first_name = (c.sender_first_name as string) || ''
    form.value.sender_last_name = (c.sender_last_name as string) || ''
    form.value.sender_email = (c.sender_email as string) || ''
    form.value.sender_phone = (c.sender_phone as string) || ''
    form.value.origin_address = (c.origin_address as string) || ''
    form.value.origin_interior = (c.origin_interior as string) || ''
    form.value.country = (c.country as string) || 'PER'
    form.value.company_name = (c.company_name as string) || ''

    // Parse services JSON
    try {
      const servicesData = JSON.parse((c.services as string) || '{}')
      if (servicesData.servicios) {
        selectedServiceIds.value = servicesData.servicios
          .filter((s: { estado: string | number }) => s.estado === '1' || s.estado === 1)
          .map((s: { id: number | string }) => Number(s.id))
      }
    } catch {
      selectedServiceIds.value = [1, 2]
    }
  }
}, { immediate: true })

function buildServicesJson(): string {
  const servicios = availableServices.map((svc) => ({
    id: svc.id,
    tipo: svc.name.replace(' ', '').toUpperCase(),
    estado: selectedServiceIds.value.includes(svc.id) ? 1 : 0,
  }))
  return JSON.stringify({ servicios })
}

async function handleSave() {
  if (!form.value.api_key.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'API Key es obligatoria', life: 3000 })
    return
  }

  const credentials = {
    ...form.value,
    services: buildServicesJson(),
  }

  try {
    if (isConfigured.value) {
      await store.updateConfig('99minutos', { credentials })
    } else {
      await store.saveConfig('99minutos', { credentials })
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
    await store.deleteConfig('99minutos')
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
  if (!simOrigin.value || !simDestination.value) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Ingresa direcciones de origen y destino', life: 3000 })
    return
  }

  try {
    isSimulating.value = true
    simResult.value = await store.calculatePrice('99minutos', {
      origin: { address: simOrigin.value },
      destination: { address: simDestination.value },
      weight: parseFloat(simWeight.value),
      country: form.value.country,
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al calcular precio',
      life: 5000,
    })
  } finally {
    isSimulating.value = false
  }
}
</script>
