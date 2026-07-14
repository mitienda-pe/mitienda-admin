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
      <img :src="homeDeliveryLogo" alt="Home Delivery" class="w-10 h-10 object-contain" />
      <div>
        <h1 class="text-2xl font-bold text-secondary">Home Delivery</h1>
        <p class="text-sm text-secondary-400 mt-1">Configuración de credenciales y origen (Grupo Falabella)</p>
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
          <!-- Credenciales -->
          <h3 class="text-lg font-semibold text-secondary-700">Credenciales API</h3>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Bearer Token</label>
            <Password
              v-model="form.bearer_token"
              class="w-full"
              :feedback="false"
              toggleMask
              placeholder="Token de acceso entregado por Home Delivery"
              inputClass="w-full"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Código de tienda</label>
              <InputText v-model="form.tienda_code" class="w-full" placeholder="Código HD (opcional para HomeDelivery)" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Dirección de origen (ID)</label>
              <InputText v-model="form.direccion_origen_id" class="w-full" placeholder="ID de dirección origen entregado por HD" />
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

          <!-- Parámetros de envío -->
          <h3 class="text-lg font-semibold text-secondary-700">Parámetros de envío</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Canal de venta</label>
              <InputText v-model="form.canal_venta" class="w-full" placeholder="MITIENDA" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre de partner (opcional)</label>
              <InputText v-model="form.partner_name" class="w-full" placeholder="Nombre del marketplace, si aplica" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Días de promesa de entrega</label>
              <InputText v-model="form.dias_promesa" class="w-full" placeholder="3" />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">Peso por defecto (kg)</label>
              <InputText v-model="form.default_weight_kg" class="w-full" placeholder="1" />
              <small class="text-secondary-400">Se usa si el producto no trae peso.</small>
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
          <h3 class="text-lg font-semibold text-secondary-700 mb-3">Sobre Home Delivery</h3>
          <p class="text-sm text-secondary-500 mb-4">
            Home Delivery (Grupo Falabella) ofrece cobertura nacional a
            provincias. El pedido se crea tras el pago (o manualmente desde
            despacho) y la etiqueta se descarga en PDF.
          </p>
          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Pasos para configurar</h4>
          <ol class="text-sm text-secondary-500 space-y-2 list-decimal list-inside">
            <li>Solicita a Home Delivery tu Bearer Token</li>
            <li>Pide el ID de dirección de origen habilitado</li>
            <li>Confirma el código de tienda (si aplica)</li>
            <li>Define los días de promesa de entrega</li>
          </ol>

          <Divider />

          <h4 class="text-sm font-semibold text-secondary-700 mb-2">Cobertura</h4>
          <ul class="text-sm text-secondary-500 space-y-1">
            <li><strong>Provincias a nivel nacional</strong></li>
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
import homeDeliveryLogo from '@/assets/images/logo-home-delivery.png'
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
  bearer_token: '',
  tienda_code: '',
  direccion_origen_id: '',
  canal_venta: 'MITIENDA',
  partner_name: '',
  dias_promesa: '3',
  default_weight_kg: '1',
  environment: 'produccion',
})

const { isDirty, reset: resetDirty } = useDirtyForm(() => form.value)

const isConfigured = computed(() => store.currentConfig?.courier?.configured ?? false)

watch(() => store.currentConfig, (config) => {
  if (config?.credentials) {
    const c = config.credentials
    form.value.bearer_token = (c.bearer_token as string) || ''
    form.value.tienda_code = (c.tienda_code as string) || ''
    form.value.direccion_origen_id = (c.direccion_origen_id as string) || ''
    form.value.canal_venta = (c.canal_venta as string) || 'MITIENDA'
    form.value.partner_name = (c.partner_name as string) || ''
    form.value.dias_promesa = (c.dias_promesa as string) || '3'
    form.value.default_weight_kg = (c.default_weight_kg as string) || '1'
    form.value.environment = (c.environment as string) || 'produccion'
  }
  resetDirty()
}, { immediate: true })

async function handleSave() {
  if (!form.value.bearer_token.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Bearer Token es obligatorio', life: 3000 })
    return
  }
  if (!form.value.direccion_origen_id.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Dirección de origen (ID) es obligatoria', life: 3000 })
    return
  }

  const credentials = { ...form.value }

  try {
    if (isConfigured.value) {
      await store.updateConfig('home_delivery', { credentials })
    } else {
      await store.saveConfig('home_delivery', { credentials })
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
  if (!window.confirm('¿Estás seguro de eliminar la configuración de Home Delivery? Se perderán las credenciales guardadas.')) return
  try {
    await store.deleteConfig('home_delivery')
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
