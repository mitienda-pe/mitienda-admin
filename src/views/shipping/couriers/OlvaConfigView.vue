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
      <div class="bg-[#FFC107] rounded-md p-2 flex items-center justify-center">
        <img :src="olvaLogo" alt="Olva Courier" class="h-6 object-contain" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-secondary">Olva Courier</h1>
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
            <label class="block text-sm font-medium text-secondary-700 mb-1">API Key (X-API-KEY)</label>
            <Password
              v-model="form.api_key"
              class="w-full"
              :feedback="false"
              toggleMask
              placeholder="Token entregado por Olva Courier"
              inputClass="w-full"
            />
            <small class="text-secondary-400">Solicita esta credencial a tu ejecutivo de ventas Olva</small>
          </div>

          <!-- Codigo Area & Servicio -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Código de Área (Centro de Costo)</label>
              <InputText v-model="form.codigo_area" class="w-full" placeholder="Ej: 1" />
              <small class="text-secondary-400">Entregado por Olva al activar la cuenta</small>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo de Servicio</label>
              <SelectButton
                v-model="form.cod_servicio"
                :options="serviceOptions"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
              />
              <small class="text-secondary-400">REC: recojo en tu almacén · LIN: logística inversa (devoluciones)</small>
            </div>
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

          <!-- Seller / Almacén origen (opcional) -->
          <div>
            <h3 class="text-lg font-semibold text-secondary-700">Datos del almacén (opcional)</h3>
            <p class="text-sm text-secondary-400 mt-1">
              Solo necesario si Olva requiere datos del seller específicos por envío.
              Si tu cuenta tiene un único almacén configurado en Olva, puedes dejar estos campos vacíos.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">RUC del Seller</label>
              <InputText v-model="form.seller_ruc" class="w-full" placeholder="20100686814" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre del Seller</label>
              <InputText v-model="form.seller_name" class="w-full" placeholder="Razón social" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Código de Almacén</label>
              <InputText v-model="form.warehouse_code" class="w-full" placeholder="Ej: ALM1" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Ubigeo del Almacén</label>
              <InputText v-model="form.origin_ubigeo" class="w-full" placeholder="150103" maxlength="6" />
              <small class="text-secondary-400">Código INEI de 6 dígitos</small>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-1">Dirección del Almacén</label>
              <InputText v-model="form.warehouse_address" class="w-full" placeholder="Av. Ejemplo 123, Lima" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-1">Referencia</label>
              <InputText v-model="form.warehouse_reference" class="w-full" placeholder="Frente al parque, edificio azul" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Contacto</label>
              <InputText v-model="form.warehouse_contact" class="w-full" placeholder="Nombre del responsable" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Teléfono</label>
              <InputText v-model="form.warehouse_phone" class="w-full" placeholder="999999999" />
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
          <h3 class="text-lg font-semibold text-secondary-700 mb-3">Sobre Olva Courier</h3>
          <p class="text-sm text-secondary-500 mb-4">
            Olva Courier es un operador logístico nacional con cobertura en todo el Perú.
            Los envíos creados desde MiTienda se registran automáticamente al confirmar el pago,
            y el seguimiento se actualiza periódicamente desde la plataforma de Olva.
          </p>

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Pasos para configurar</h4>
          <ol class="text-sm text-secondary-500 space-y-2 list-decimal list-inside">
            <li>Solicita una cuenta corporativa con Olva Courier</li>
            <li>Pide al ejecutivo de ventas tu <strong>X-API-KEY</strong> y tu <strong>código de área</strong> (centro de costo)</li>
            <li>Define qué servicio usarás: REC (recojos) o LIN (logística inversa)</li>
            <li>Ingresa las credenciales en este formulario</li>
            <li>Activa el entorno de producción cuando termines las pruebas</li>
          </ol>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Servicios disponibles</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>REC — Recojos:</strong> Olva recoge los pedidos en tu almacén y entrega al destinatario</li>
            <li><strong>LIN — Logística Inversa:</strong> Olva recoge en domicilio del cliente y devuelve a tu almacén</li>
          </ul>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Cobertura</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Nacional:</strong> Todo el Perú</li>
            <li><strong>Ubigeo:</strong> Código INEI de 6 dígitos requerido por destino</li>
          </ul>

          <Divider />

          <div class="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
            <i class="pi pi-info-circle mr-1"></i>
            La integración con Olva no incluye endpoint de cotización en tiempo real.
            Las tarifas se manejan por contrato directo entre tu tienda y Olva.
          </div>
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
import olvaLogo from '@/assets/images/logo-olva.svg'
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

const serviceOptions = [
  { label: 'REC — Recojos', value: 'REC' },
  { label: 'LIN — Logística Inversa', value: 'LIN' },
]

const form = ref({
  api_key: '',
  codigo_area: '',
  origin_ubigeo: '',
  seller_ruc: '',
  seller_name: '',
  warehouse_code: '',
  warehouse_address: '',
  warehouse_reference: '',
  warehouse_contact: '',
  warehouse_phone: '',
  cod_servicio: 'REC',
  environment: 'produccion',
})

const { isDirty, reset: resetDirty } = useDirtyForm(() => form.value)

const isConfigured = computed(() => store.currentConfig?.courier?.configured ?? false)

// Populate form when config loads
watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials
    form.value.api_key = (c.api_key as string) || ''
    form.value.codigo_area = (c.codigo_area as string) || ''
    form.value.origin_ubigeo = (c.origin_ubigeo as string) || ''
    form.value.seller_ruc = (c.seller_ruc as string) || ''
    form.value.seller_name = (c.seller_name as string) || ''
    form.value.warehouse_code = (c.warehouse_code as string) || ''
    form.value.warehouse_address = (c.warehouse_address as string) || ''
    form.value.warehouse_reference = (c.warehouse_reference as string) || ''
    form.value.warehouse_contact = (c.warehouse_contact as string) || ''
    form.value.warehouse_phone = (c.warehouse_phone as string) || ''
    form.value.cod_servicio = (c.cod_servicio as string) || 'REC'
    form.value.environment = (c.environment as string) || 'produccion'
  }
  resetDirty()
}, { immediate: true })

async function handleSave() {
  if (!form.value.api_key.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'API Key es obligatoria', life: 3000 })
    return
  }

  if (!form.value.codigo_area.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Código de Área es obligatorio', life: 3000 })
    return
  }

  if (form.value.origin_ubigeo && !/^\d{6}$/.test(form.value.origin_ubigeo)) {
    toast.add({ severity: 'warn', summary: 'Ubigeo inválido', detail: 'El ubigeo debe tener 6 dígitos numéricos', life: 3000 })
    return
  }

  const credentials = { ...form.value }

  try {
    if (isConfigured.value) {
      await store.updateConfig('olva', { credentials })
    } else {
      await store.saveConfig('olva', { credentials })
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
  if (!window.confirm('¿Estás seguro de eliminar la configuración de Olva? Se perderán las credenciales guardadas.')) return
  try {
    await store.deleteConfig('olva')
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
