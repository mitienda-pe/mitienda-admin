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
      <img :src="cabifyLogo" alt="Cabify Logistics" class="w-10 h-10 object-contain" />
      <div>
        <h1 class="text-2xl font-bold text-secondary">Cabify Logistics</h1>
        <p class="text-sm text-secondary-400 mt-1">Configuración de credenciales y origen de recojo</p>
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
          <!-- Credenciales OAuth -->
          <h3 class="text-lg font-semibold text-secondary-700">Credenciales API (OAuth2)</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Client ID</label>
              <InputText v-model="form.client_id" class="w-full" placeholder="OAuth client_id de Cabify" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Client Secret</label>
              <Password
                v-model="form.client_secret"
                class="w-full"
                :feedback="false"
                toggleMask
                placeholder="OAuth client_secret"
                inputClass="w-full"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo de envío por defecto</label>
              <div class="flex gap-2">
                <Dropdown
                  v-model="form.shipping_type_id"
                  :options="shippingTypes"
                  optionLabel="name"
                  optionValue="id"
                  editable
                  class="flex-1"
                  placeholder="Consulta los disponibles o pega el ID"
                />
                <Button
                  icon="pi pi-sync"
                  severity="secondary"
                  outlined
                  :loading="isLoadingShippingTypes"
                  v-tooltip.top="'Consultar los tipos disponibles en tu cuenta Cabify'"
                  @click="loadShippingTypes"
                />
              </div>
              <small class="text-secondary-400">
                El ID es propio de tu cuenta Cabify. Completa credenciales y coordenadas de origen,
                luego consulta los tipos disponibles para esa ubicación. Se usa en todos los envíos
                que no tengan un tipo asignado más abajo.
              </small>
            </div>
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
          </div>

          <Divider />

          <!-- Tipo de envío por servicio -->
          <div>
            <h3 class="text-lg font-semibold text-secondary-700">Tipo de envío por servicio</h3>
            <p class="text-sm text-secondary-400 mt-1">
              Opcional. Si tu tienda ofrece varios servicios de envío en el checkout, indica con qué
              tipo de Cabify se despacha cada uno. Los que dejes vacíos salen con el tipo por defecto.
            </p>
          </div>

          <div v-if="serviceTypes.length" class="space-y-3">
            <div
              v-for="serviceType in serviceTypes"
              :key="serviceType.service_type_id"
              class="grid grid-cols-1 md:grid-cols-3 gap-3 md:items-center"
            >
              <label class="text-sm font-medium text-secondary-700">
                {{ serviceType.service_type_nombre }}
              </label>
              <div class="md:col-span-2 flex gap-2">
                <Dropdown
                  v-model="serviceTypeMap[serviceType.service_type_id]"
                  :options="shippingTypes"
                  optionLabel="name"
                  optionValue="id"
                  editable
                  class="flex-1"
                  placeholder="Usa el tipo por defecto"
                />
                <Button
                  icon="pi pi-times"
                  severity="secondary"
                  outlined
                  :disabled="!serviceTypeMap[serviceType.service_type_id]"
                  v-tooltip.top="'Volver al tipo por defecto'"
                  @click="serviceTypeMap[serviceType.service_type_id] = ''"
                />
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-secondary-400">
            No se pudieron cargar los tipos de servicio de envío.
          </p>

          <Divider />

          <!-- Origen -->
          <h3 class="text-lg font-semibold text-secondary-700">Origen de recojo (almacén)</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-1">Dirección de origen</label>
              <InputText v-model="form.origin_address" class="w-full" placeholder="Av. Ejemplo 123, Miraflores, Lima" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Latitud</label>
              <InputText v-model="form.origin_lat" class="w-full" placeholder="-12.1211" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Longitud</label>
              <InputText v-model="form.origin_lon" class="w-full" placeholder="-77.0299" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Contacto (nombre)</label>
              <InputText v-model="form.origin_contact_name" class="w-full" placeholder="Nombre de quien entrega" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Contacto (teléfono)</label>
              <InputText v-model="form.origin_contact_phone" class="w-full" placeholder="+51999999999" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-1">Instrucciones de recojo</label>
              <InputText v-model="form.origin_instructions" class="w-full" placeholder="Ej. Tocar timbre, oficina 2" />
            </div>
          </div>

          <Divider />

          <!-- Paquete por defecto -->
          <h3 class="text-lg font-semibold text-secondary-700">Valores por defecto</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Peso por defecto (g)</label>
              <InputText v-model="form.default_weight_g" class="w-full" placeholder="1000" />
              <small class="text-secondary-400">Se usa si la orden no trae peso.</small>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Moneda</label>
              <InputText v-model="form.currency" class="w-full" placeholder="PEN" />
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
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-secondary-700 mb-3">Sobre Cabify Logistics</h3>
          <p class="text-sm text-secondary-500 mb-4">
            Cabify Logistics ofrece reparto express y same day en Lima
            Metropolitana. El envío se crea tras el pago (o manualmente
            desde despacho) y se rastrea con la URL de tracking de Cabify.
          </p>
          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Pasos para configurar</h4>
          <ol class="text-sm text-secondary-500 space-y-2 list-decimal list-inside">
            <li>Solicita tus credenciales OAuth (client_id / client_secret) a Cabify</li>
            <li>Ingresa la latitud/longitud y dirección de tu almacén de origen</li>
            <li>Consulta los tipos de envío disponibles con el botón de recarga y elige el tuyo</li>
            <li>Si ofreces varios servicios de envío, asigna el tipo de Cabify de cada uno</li>
            <li>Usa el entorno de prueba (sandbox) antes de activar en producción</li>
          </ol>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Cobertura</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Lima Metropolitana</strong></li>
          </ul>
        </div>
      </div>
    </div>

    <UnsavedChangesBar
      :dirty="isDirty"
      :loading="store.isSaving"
      :save-label="isConfigured ? 'Actualizar' : 'Guardar'"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourierProvidersStore } from '@/stores/courier-providers.store'
import { useDirtyForm } from '@/composables/useDirtyForm'
import { useToast } from 'primevue/usetoast'
import { courierProvidersApi } from '@/api/courier-providers.api'
import { shippingServiceTypesApi } from '@/api/shipping.api'
import type { CabifyShippingType, CourierEnvironment } from '@/types/courier-provider.types'
import type { ShippingServiceType } from '@/types/shipping.types'
import cabifyLogo from '@/assets/images/logo-cabify-logistics.svg'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import SelectButton from 'primevue/selectbutton'
import Dropdown from 'primevue/dropdown'
import Divider from 'primevue/divider'
import { UnsavedChangesBar } from '@/components/ui'

const router = useRouter()
const store = useCourierProvidersStore()
const toast = useToast()

const environmentOptions = [
  { label: 'Producción', value: 'produccion' },
  { label: 'Prueba (Sandbox)', value: 'prueba' },
]

const form = ref({
  client_id: '',
  client_secret: '',
  shipping_type_id: '',
  environment: 'produccion',
  origin_address: '',
  origin_lat: '',
  origin_lon: '',
  origin_contact_name: '',
  origin_contact_phone: '',
  origin_instructions: '',
  default_weight_g: '1000',
  currency: 'PEN',
})

/**
 * Mapa tipo de servicio de la plataforma -> shipping_type_id de Cabify.
 * Clave = service_type_id; valor vacío significa "usa el tipo por defecto".
 */
const serviceTypeMap = ref<Record<number, string>>({})
const serviceTypes = ref<ShippingServiceType[]>([])

const { isDirty, reset: resetDirty } = useDirtyForm(() => ({
  ...form.value,
  service_type_map: serviceTypeMap.value,
}))

onMounted(async () => {
  try {
    const response = await shippingServiceTypesApi.getAll()
    serviceTypes.value = response.data ?? []
  } catch {
    serviceTypes.value = []
  }
})

const isConfigured = computed(() => store.currentConfig?.courier?.configured ?? false)

const shippingTypes = ref<CabifyShippingType[]>([])
const isLoadingShippingTypes = ref(false)

/**
 * Los shipping_type_id son opacos y propios de cada cuenta Cabify, y qué
 * subconjunto está disponible depende de la ubicación. La única fuente de
 * verdad es la API, así que los consultamos con las credenciales del form
 * (sirve incluso antes de guardar) y el origen configurado.
 */
async function loadShippingTypes() {
  if (!form.value.client_id.trim() || !form.value.client_secret.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Faltan credenciales',
      detail: 'Ingresa Client ID y Client Secret para consultar a Cabify',
      life: 4000,
    })
    return
  }

  const lat = Number(form.value.origin_lat)
  const lon = Number(form.value.origin_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat === 0 || lon === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Falta el origen',
      detail: 'Los tipos disponibles dependen de la ubicación: completa latitud y longitud',
      life: 4000,
    })
    return
  }

  isLoadingShippingTypes.value = true
  try {
    shippingTypes.value = await courierProvidersApi.getCabifyShippingTypes({
      client_id: form.value.client_id,
      client_secret: form.value.client_secret,
      environment: form.value.environment as CourierEnvironment,
      lat,
      lon,
    })

    toast.add(
      shippingTypes.value.length
        ? {
            severity: 'success',
            summary: 'Tipos disponibles',
            detail: `Cabify devolvió ${shippingTypes.value.length} tipo(s) para ese origen`,
            life: 3000,
          }
        : {
            severity: 'warn',
            summary: 'Sin resultados',
            detail: 'Cabify no devolvió tipos de envío para esa ubicación',
            life: 4000,
          },
    )
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'No se pudieron obtener los tipos de envío',
      life: 5000,
    })
  } finally {
    isLoadingShippingTypes.value = false
  }
}

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials
    form.value.client_id = (c.client_id as string) || ''
    form.value.client_secret = (c.client_secret as string) || ''
    form.value.shipping_type_id = (c.shipping_type_id as string) || ''
    form.value.environment = (c.environment as string) || 'produccion'
    form.value.origin_address = (c.origin_address as string) || ''
    form.value.origin_lat = (c.origin_lat as string) || ''
    form.value.origin_lon = (c.origin_lon as string) || ''
    form.value.origin_contact_name = (c.origin_contact_name as string) || ''
    form.value.origin_contact_phone = (c.origin_contact_phone as string) || ''
    form.value.origin_instructions = (c.origin_instructions as string) || ''
    form.value.default_weight_g = (c.default_weight_g as string) || '1000'
    form.value.currency = (c.currency as string) || 'PEN'
  }

  const savedMap = config?.service_type_map ?? {}
  serviceTypeMap.value = Object.fromEntries(
    Object.entries(savedMap).map(([serviceTypeId, value]) => [Number(serviceTypeId), value]),
  )

  resetDirty()
}, { immediate: true })

async function handleSave() {
  if (!form.value.client_id.trim() || !form.value.client_secret.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Client ID y Client Secret son obligatorios', life: 3000 })
    return
  }
  if (!form.value.shipping_type_id.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Shipping Type ID es obligatorio', life: 3000 })
    return
  }

  const credentials = { ...form.value }

  // Solo viajan los servicios con tipo propio: el resto se resuelve con el default.
  const service_type_map = Object.fromEntries(
    Object.entries(serviceTypeMap.value)
      .map(([serviceTypeId, value]) => [serviceTypeId, (value ?? '').trim()])
      .filter(([, value]) => value !== ''),
  )

  try {
    if (isConfigured.value) {
      await store.updateConfig('cabify', { credentials, service_type_map })
    } else {
      await store.saveConfig('cabify', { credentials, service_type_map })
    }
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración guardada correctamente', life: 3000 })
    resetDirty()
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
  if (!window.confirm('¿Estás seguro de eliminar la configuración de Cabify? Se perderán las credenciales guardadas.')) return
  try {
    await store.deleteConfig('cabify')
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
</script>
