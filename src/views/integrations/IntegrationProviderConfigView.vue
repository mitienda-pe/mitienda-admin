<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIntegrationProvidersStore } from '@/stores/integration-providers.store'
import { useToast } from 'primevue/usetoast'
import { AppButton, AppBadge, AppErrorState } from '@/components/ui'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'

const route = useRoute()
const router = useRouter()
const store = useIntegrationProvidersStore()
const toast = useToast()

const code = computed(() => route.params.code as string)

// Form state
const formCredentials = ref<Record<string, string>>({})
const formEvents = ref<string[]>([])

const eventLabels: Record<string, string> = {
  'customer.created': 'Nuevo cliente registrado',
  'order.created': 'Nueva orden creada',
  'order.paid': 'Orden pagada',
  'product.updated': 'Producto actualizado'
}

onMounted(() => {
  loadConfig()
})

watch(code, () => {
  loadConfig()
})

async function loadConfig() {
  if (!code.value) return
  await store.fetchConfig(code.value)
  initForm()
}

function initForm() {
  const config = store.currentConfig
  if (!config) return

  // Initialize credentials form
  const creds: Record<string, string> = {}
  for (const field of config.provider.config_fields) {
    creds[field.key] = config.credentials?.[field.key] ?? ''
  }
  formCredentials.value = creds

  // Initialize events
  formEvents.value = config.config?.events ?? [...config.provider.supported_events]
}

const provider = computed(() => store.currentConfig?.provider)
const isConfigured = computed(() => store.currentConfig?.configured ?? false)
const isEnabled = computed(() => store.currentConfig?.enabled ?? false)

async function handleSave() {
  if (!code.value || !provider.value) return

  if (formEvents.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Eventos requeridos',
      detail: 'Selecciona al menos un evento',
      life: 3000
    })
    return
  }

  const data = {
    credentials: formCredentials.value,
    config: { events: formEvents.value }
  }

  let ok: boolean
  if (isConfigured.value) {
    ok = await store.updateConfig(code.value, data)
  } else {
    ok = await store.saveConfig(code.value, data)
  }

  if (ok) {
    toast.add({
      severity: 'success',
      summary: isConfigured.value ? 'Actualizado' : 'Configurado',
      detail: `${provider.value.name} configurado exitosamente`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo guardar',
      life: 5000
    })
  }
}

async function handleTest() {
  if (!code.value) return
  const result = await store.testConnection(code.value)
  if (result) {
    toast.add({
      severity: result.success ? 'success' : 'error',
      summary: result.success ? 'Conexión exitosa' : 'Conexión fallida',
      detail: result.message,
      life: 5000
    })
  }
}

async function handleToggle() {
  if (!code.value) return
  const ok = await store.toggleProvider(code.value)
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: store.currentConfig?.enabled ? 'Proveedor activado' : 'Proveedor desactivado',
      life: 3000
    })
  }
}

async function handleDelete() {
  if (!code.value || !confirm('¿Eliminar la configuración de este proveedor?')) return
  const ok = await store.deleteConfig(code.value)
  if (ok) {
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Configuración eliminada', life: 3000 })
    router.push('/integrations/providers')
  }
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Back button -->
    <div class="mb-4">
      <AppButton variant="text" @click="router.push('/integrations/providers')">
        <i class="pi pi-arrow-left mr-2" />
        Volver a proveedores
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <AppErrorState v-else-if="store.error && !store.currentConfig" :message="store.error" @retry="loadConfig" />

    <!-- Not found -->
    <div v-else-if="!store.currentConfig" class="text-center py-12 text-gray-500">
      <i class="pi pi-exclamation-triangle text-4xl mb-4 block" />
      <p>Proveedor no encontrado</p>
    </div>

    <!-- Content -->
    <div v-else-if="provider" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main form (2/3) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-800">{{ provider.name }}</h1>
            <AppBadge v-if="isConfigured" :variant="isEnabled ? 'success' : 'warning'">
              {{ isEnabled ? 'Activo' : 'Pausado' }}
            </AppBadge>
          </div>
          <div v-if="isConfigured" class="flex gap-2">
            <AppButton
              :variant="isEnabled ? 'secondary' : 'primary'"
              size="small"
              @click="handleToggle"
              :loading="store.isSaving"
            >
              <i :class="isEnabled ? 'pi pi-pause' : 'pi pi-play'" class="mr-1" />
              {{ isEnabled ? 'Pausar' : 'Activar' }}
            </AppButton>
          </div>
        </div>

        <!-- Status banner -->
        <div
          v-if="store.currentConfig?.last_error"
          class="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-red-500 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-red-700">Último error</p>
              <p class="text-sm text-red-600 mt-1">{{ store.currentConfig.last_error }}</p>
              <p v-if="store.currentConfig.last_failure_at" class="text-xs text-red-400 mt-1">
                {{ new Date(store.currentConfig.last_failure_at).toLocaleString('es-PE') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Credentials Form -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-700 mb-4">Credenciales</h3>
          <div class="space-y-4">
            <div v-for="field in provider.config_fields" :key="field.key">
              <label class="block text-sm font-medium text-secondary-700 mb-1">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
              </label>
              <Password
                v-if="field.type === 'password'"
                v-model="formCredentials[field.key]"
                :placeholder="field.placeholder"
                :feedback="false"
                toggleMask
                class="w-full"
                inputClass="w-full"
              />
              <InputText
                v-else
                v-model="formCredentials[field.key]"
                :placeholder="field.placeholder"
                class="w-full"
              />
              <small v-if="field.help" class="text-gray-400 mt-1 block">{{ field.help }}</small>
            </div>
          </div>
        </div>

        <!-- Events Selection -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-700 mb-4">Eventos a sincronizar</h3>
          <p class="text-sm text-gray-500 mb-3">
            Selecciona qué eventos de tu tienda se enviarán a {{ provider.name }}
          </p>
          <div class="space-y-3">
            <div
              v-for="evt in provider.supported_events"
              :key="evt"
              class="flex items-center gap-3"
            >
              <Checkbox v-model="formEvents" :value="evt" :inputId="'evt-' + evt" />
              <label :for="'evt-' + evt" class="cursor-pointer">
                <span class="text-sm font-medium text-gray-700">
                  {{ eventLabels[evt] || evt }}
                </span>
                <span class="text-xs text-gray-400 ml-2 font-mono">{{ evt }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between">
          <div class="flex gap-2">
            <AppButton
              variant="primary"
              @click="handleSave"
              :loading="store.isSaving"
            >
              <i class="pi pi-save mr-2" />
              {{ isConfigured ? 'Actualizar' : 'Guardar' }}
            </AppButton>
            <AppButton
              v-if="isConfigured"
              variant="secondary"
              @click="handleTest"
              :loading="store.isTesting"
            >
              <i class="pi pi-bolt mr-2" />
              Probar conexión
            </AppButton>
          </div>
          <AppButton
            v-if="isConfigured"
            variant="danger"
            @click="handleDelete"
            :loading="store.isSaving"
          >
            <i class="pi pi-trash mr-2" />
            Eliminar
          </AppButton>
        </div>

        <!-- Test result -->
        <div
          v-if="store.testResult"
          class="rounded-lg p-4"
          :class="store.testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'"
        >
          <div class="flex items-center gap-2">
            <i
              :class="store.testResult.success ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-red-600'"
            />
            <span
              class="text-sm font-medium"
              :class="store.testResult.success ? 'text-green-700' : 'text-red-700'"
            >
              {{ store.testResult.message }}
            </span>
          </div>
        </div>
      </div>

      <!-- Sidebar (1/3) -->
      <div class="space-y-6">
        <!-- Provider Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-700 mb-3">Acerca de {{ provider.name }}</h3>
          <p class="text-sm text-gray-600 mb-4">{{ provider.description }}</p>

          <h4 class="text-sm font-medium text-gray-700 mb-2">Eventos soportados</h4>
          <ul class="space-y-1">
            <li
              v-for="evt in provider.supported_events"
              :key="evt"
              class="text-sm text-gray-600 flex items-center gap-2"
            >
              <i class="pi pi-check text-xs text-green-500" />
              {{ eventLabels[evt] || evt }}
            </li>
          </ul>
        </div>

        <!-- Last sync info -->
        <div v-if="isConfigured" class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-700 mb-3">Estado de sincronización</h3>
          <div class="space-y-2 text-sm">
            <div v-if="store.currentConfig?.last_success_at" class="flex items-center gap-2">
              <i class="pi pi-check-circle text-green-500" />
              <div>
                <span class="text-gray-500">Último éxito:</span>
                <span class="text-gray-700 ml-1">
                  {{ new Date(store.currentConfig.last_success_at).toLocaleString('es-PE') }}
                </span>
              </div>
            </div>
            <div v-if="store.currentConfig?.last_failure_at" class="flex items-center gap-2">
              <i class="pi pi-times-circle text-red-500" />
              <div>
                <span class="text-gray-500">Último fallo:</span>
                <span class="text-gray-700 ml-1">
                  {{ new Date(store.currentConfig.last_failure_at).toLocaleString('es-PE') }}
                </span>
              </div>
            </div>
            <div v-if="!store.currentConfig?.last_success_at && !store.currentConfig?.last_failure_at" class="text-gray-400">
              Sin actividad registrada
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
