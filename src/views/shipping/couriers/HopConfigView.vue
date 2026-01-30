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
      <img :src="hopLogo" alt="HOP" class="w-10 h-10 object-contain" />
      <div>
        <h1 class="text-2xl font-bold text-secondary">HOP Envíos</h1>
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
          <!-- API Credentials -->
          <h3 class="text-lg font-semibold text-secondary-700">Credenciales API</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Client ID</label>
              <Password
                v-model="form.client_id"
                class="w-full"
                :feedback="false"
                toggleMask
                placeholder="Client ID de HOP"
                inputClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Client Secret</label>
              <Password
                v-model="form.client_secret"
                class="w-full"
                :feedback="false"
                toggleMask
                placeholder="Client Secret de HOP"
                inputClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Email</label>
              <InputText v-model="form.email" class="w-full" placeholder="email@ejemplo.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Contraseña</label>
              <Password
                v-model="form.password"
                class="w-full"
                :feedback="false"
                toggleMask
                placeholder="Contraseña de la cuenta HOP"
                inputClass="w-full"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Seller Code</label>
            <InputText v-model="form.seller_code" class="w-full" placeholder="Código de vendedor asignado por HOP" />
            <small class="text-secondary-400">Código proporcionado por HOP para identificar tu cuenta</small>
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
              <label class="block text-sm font-medium text-secondary-700 mb-1">Código postal origen</label>
              <InputText v-model="form.origin_zipcode" class="w-full" placeholder="15001" />
              <small class="text-secondary-400">Código postal para cotización de envíos</small>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">País</label>
              <SelectButton
                v-model="form.country"
                :options="countryOptions"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
              />
            </div>
          </div>

          <Divider />

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
            <small class="text-secondary-400 mt-1 block">Usa "Prueba" (sandbox) para verificar la integración antes de activar en producción</small>
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
              <label class="block text-sm font-medium text-secondary-700 mb-1">Código postal destino</label>
              <InputText v-model="simDestZipcode" class="w-full" placeholder="15046" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Valor del paquete (S/.)</label>
              <InputText v-model="simPackageValue" class="w-full" placeholder="50" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Peso (gramos)</label>
              <InputText v-model="simWeight" class="w-full" placeholder="1000" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Dimensiones (cm): Alto x Largo x Ancho</label>
              <div class="flex gap-2">
                <InputText v-model="simHeight" class="w-full" placeholder="10" />
                <InputText v-model="simLength" class="w-full" placeholder="10" />
                <InputText v-model="simWidth" class="w-full" placeholder="10" />
              </div>
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
          <h3 class="text-lg font-semibold text-secondary-700 mb-3">Sobre HOP Envíos</h3>
          <p class="text-sm text-secondary-500 mb-4">
            HOP es una plataforma logística con red de puntos de entrega y retiro
            en Argentina, Uruguay y Perú. Ofrece envío a domicilio y retiro en punto de entrega.
          </p>
          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Pasos para configurar</h4>
          <ol class="text-sm text-secondary-500 space-y-2 list-decimal list-inside">
            <li>Solicita tus credenciales de integración a HOP</li>
            <li>Ingresa Client ID, Client Secret, Email y Contraseña</li>
            <li>Configura tu Seller Code asignado por HOP</li>
            <li>Completa los datos de remitente y dirección de origen</li>
            <li>Prueba con el entorno Sandbox antes de pasar a Producción</li>
          </ol>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Servicios disponibles</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Envío a domicilio:</strong> Entrega puerta a puerta</li>
            <li><strong>Punto de entrega:</strong> Red de puntos HOP para retiro</li>
            <li><strong>Tracking:</strong> Seguimiento en tiempo real</li>
          </ul>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Países soportados</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>PE:</strong> Perú</li>
            <li><strong>AR:</strong> Argentina</li>
            <li><strong>UY:</strong> Uruguay</li>
          </ul>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Cotización</h4>
          <p class="text-sm text-secondary-500">
            La cotización usa códigos postales de origen y destino, más las dimensiones
            y peso del paquete (cm y gramos).
          </p>
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
import Divider from 'primevue/divider'
import hopLogo from '@/assets/images/logo-hop.svg'

const router = useRouter()
const store = useCourierProvidersStore()
const toast = useToast()

const countryOptions = [
  { label: 'Perú', value: 'PE' },
  { label: 'Argentina', value: 'AR' },
  { label: 'Uruguay', value: 'UY' },
]

const environmentOptions = [
  { label: 'Producción', value: 'produccion' },
  { label: 'Prueba (Sandbox)', value: 'prueba' },
]

const form = ref({
  client_id: '',
  client_secret: '',
  email: '',
  password: '',
  seller_code: '',
  sender_name: '',
  sender_phone: '',
  origin_address: '',
  origin_zipcode: '',
  country: 'PE',
  environment: 'prueba',
})

// Simulator
const simDestZipcode = ref('')
const simPackageValue = ref('')
const simWeight = ref('1000')
const simHeight = ref('10')
const simLength = ref('10')
const simWidth = ref('10')
const isSimulating = ref(false)
const simResult = ref<unknown>(null)

const isConfigured = computed(() => store.currentConfig?.courier?.configured ?? false)

// Populate form when config loads
watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials
    form.value.client_id = (c.client_id as string) || ''
    form.value.client_secret = (c.client_secret as string) || ''
    form.value.email = (c.email as string) || ''
    form.value.password = (c.password as string) || ''
    form.value.seller_code = (c.seller_code as string) || ''
    form.value.sender_name = (c.sender_name as string) || ''
    form.value.sender_phone = (c.sender_phone as string) || ''
    form.value.origin_address = (c.origin_address as string) || ''
    form.value.origin_zipcode = (c.origin_zipcode as string) || ''
    form.value.country = (c.country as string) || 'PE'
    form.value.environment = (c.environment as string) || 'prueba'
  }
}, { immediate: true })

async function handleSave() {
  if (!form.value.client_id.trim() || !form.value.client_secret.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Client ID y Client Secret son obligatorios', life: 3000 })
    return
  }
  if (!form.value.email.trim() || !form.value.password.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Email y Contraseña son obligatorios', life: 3000 })
    return
  }
  if (!form.value.seller_code.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'El Seller Code es obligatorio', life: 3000 })
    return
  }

  const credentials = { ...form.value }

  try {
    if (isConfigured.value) {
      await store.updateConfig('hop', { credentials })
    } else {
      await store.saveConfig('hop', { credentials })
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
    await store.deleteConfig('hop')
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
  if (!simDestZipcode.value) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Ingresa el código postal de destino', life: 3000 })
    return
  }

  try {
    isSimulating.value = true
    simResult.value = await store.calculatePrice('hop', {
      origin: {
        zipcode: form.value.origin_zipcode,
      },
      destination: {
        zipcode: simDestZipcode.value,
      },
      package_value: parseFloat(simPackageValue.value) || 0,
      weight: parseInt(simWeight.value) || 1000,
      height: parseInt(simHeight.value) || 10,
      length: parseInt(simLength.value) || 10,
      width: parseInt(simWidth.value) || 10,
      country: form.value.country,
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
