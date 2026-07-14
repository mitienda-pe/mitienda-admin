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
              <label class="block text-sm font-medium text-secondary-700 mb-1">Shipping Type ID</label>
              <InputText v-model="form.shipping_type_id" class="w-full" placeholder="UUID del tipo de envío (express / same day)" />
              <small class="text-secondary-400">Lo entrega Cabify según la cobertura de tu origen.</small>
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
            <li>Pide el Shipping Type ID de tu cobertura</li>
            <li>Ingresa la latitud/longitud y dirección de tu almacén de origen</li>
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCourierProvidersStore } from '@/stores/courier-providers.store'
import { useDirtyForm } from '@/composables/useDirtyForm'
import { useToast } from 'primevue/usetoast'
import cabifyLogo from '@/assets/images/logo-cabify-logistics.svg'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import SelectButton from 'primevue/selectbutton'
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

const { isDirty, reset: resetDirty } = useDirtyForm(() => form.value)

const isConfigured = computed(() => store.currentConfig?.courier?.configured ?? false)

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

  try {
    if (isConfigured.value) {
      await store.updateConfig('cabify', { credentials })
    } else {
      await store.saveConfig('cabify', { credentials })
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
