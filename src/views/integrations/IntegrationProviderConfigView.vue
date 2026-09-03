<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIntegrationProvidersStore } from '@/stores/integration-providers.store'
import { useToast } from 'primevue/usetoast'
import { AppButton, AppBadge, AppErrorState } from '@/components/ui'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import type { IntegrationProviderField } from '@/types/integration-provider.types'

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
  'product.updated': 'Producto actualizado',
  'cart.abandoned': 'Carrito abandonado'
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

  // Initialize credentials form (use saved value, then default, then empty)
  const creds: Record<string, string> = {}
  for (const field of config.provider.config_fields) {
    creds[field.key] = config.credentials?.[field.key] ?? field.default ?? ''
  }
  formCredentials.value = creds

  // Initialize events
  formEvents.value = config.config?.events ?? [...config.provider.supported_events]
}

/** Normalize options to { value, label } format (handles both string[] and object[]) */
function normalizeOptions(options: any[]): { value: string; label: string }[] {
  if (!options?.length) return []
  if (typeof options[0] === 'string') {
    return options.map((o: string) => ({ value: o, label: o }))
  }
  return options
}

const provider = computed(() => store.currentConfig?.provider)
const isConfigured = computed(() => store.currentConfig?.configured ?? false)
const isEnabled = computed(() => store.currentConfig?.enabled ?? false)

/**
 * Some credentials are only needed to set the provider up — a one-time OAuth grant token is
 * consumed on first use and comes back empty, so requiring it on every edit would force the
 * merchant back to the provider's console just to change an unrelated field. Leaving it blank
 * keeps the authorization already stored.
 */
function isFieldRequired(field: IntegrationProviderField): boolean {
  if (field.required === false) return false
  return !(field.required_on_create_only && isConfigured.value)
}

const isFrontendOnly = computed(() => provider.value?.frontend_only === true)
const hasEvents = computed(() => (provider.value?.supported_events?.length ?? 0) > 0)
const hasCredentialFields = computed(() => (provider.value?.config_fields?.length ?? 0) > 0)

/**
 * El Asistente IA no pide credenciales: sin formulario no hay "Guardar", y sin guardar
 * nunca quedaba `configured`, así que el botón Activar —que solo se mostraba ya
 * configurado— tampoco aparecía. La pantalla no tenía una sola acción. Para estos
 * providers el toggle es el alta, y el backend lo resuelve creando la fila prendida.
 */
const canToggle = computed(() => isConfigured.value || !hasCredentialFields.value)

/**
 * El Asistente IA indexa el catálogo en el backend RAG, y la API no publica el
 * widget hasta que termina — un chat de compras que no encuentra nada se lee como
 * una tienda vacía. Entre activar e indexar hay una espera que hay que contar,
 * porque el comerciante visita su tienda, no ve el chat y asume que falló.
 */
const needsIndexing = computed(() => store.currentConfig?.indexed !== undefined)
const isIndexed = computed(() => store.currentConfig?.indexed === true)
const indexedProducts = computed(() => store.currentConfig?.indexed_products ?? null)

/**
 * Dos formas de quedar activo sin llegar nunca a indexarse, y las dos merecen un
 * mensaje propio: sin plan habilitado la tienda no entra al sync, y con el
 * catálogo vacío no hay nada que indexar. Contarlas como "Indexando" deja un
 * spinner girando para siempre.
 */
const indexBlocked = computed(() => {
  if (!needsIndexing.value || !isEnabled.value || isIndexed.value) return null
  if (store.currentConfig?.index_eligible === false) return 'plan'
  if (store.currentConfig?.index_empty === true) return 'empty'
  return null
})

const isIndexing = computed(
  () => needsIndexing.value && isEnabled.value && !isIndexed.value && indexBlocked.value === null
)

const indexedAtLabel = computed(() => {
  const raw = store.currentConfig?.indexed_at
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleString('es-PE')
})

/**
 * Mientras se indexa, sondear para que el aviso se resuelva solo.
 *
 * El indexado lo hace un backend aparte y puede tardar minutos en un catálogo
 * grande; sin esto el cartel "Indexando productos" se queda fijo hasta que el
 * comerciante recarga a mano, que es justo la duda que el cartel viene a evitar.
 * Se usa `refreshConfig` y no `fetchConfig` porque este último vacía la vista y
 * muestra el spinner de página completa en cada vuelta.
 */
const INDEXING_POLL_MS = 15000
let indexingPoll: ReturnType<typeof setInterval> | null = null

function stopIndexingPoll() {
  if (indexingPoll !== null) {
    clearInterval(indexingPoll)
    indexingPoll = null
  }
}

watch(isIndexing, (indexing) => {
  if (!indexing) {
    stopIndexingPoll()
    return
  }
  if (indexingPoll !== null) return
  indexingPoll = setInterval(() => {
    if (code.value) store.refreshConfig(code.value)
  }, INDEXING_POLL_MS)
})

onUnmounted(stopIndexingPoll)

async function handleSave() {
  if (!code.value || !provider.value) return

  // Validate all required credential fields are non-empty
  const requiredFields = provider.value.config_fields.filter(isFieldRequired)
  const emptyFields = requiredFields.filter((f) => !formCredentials.value[f.key]?.trim())
  if (emptyFields.length > 0) {
    toast.add({
      severity: 'error',
      summary: 'Credenciales incompletas',
      detail: `Completa los campos: ${emptyFields.map((f: any) => f.label).join(', ')}`,
      life: 5000
    })
    return
  }

  if (hasEvents.value && formEvents.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Eventos requeridos',
      detail: 'Selecciona al menos un evento',
      life: 3000
    })
    return
  }

  const data: any = {
    credentials: formCredentials.value,
  }
  if (hasEvents.value) {
    data.config = { events: formEvents.value }
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
            <AppBadge v-if="indexBlocked !== null" variant="warning">Sin publicar</AppBadge>
            <AppBadge v-else-if="isIndexing" variant="warning">Indexando</AppBadge>
            <AppBadge
              v-else-if="isConfigured || !hasCredentialFields"
              :variant="isEnabled ? 'success' : 'warning'"
            >
              {{ isEnabled ? 'Activo' : 'Pausado' }}
            </AppBadge>
          </div>
          <div v-if="canToggle" class="flex gap-2">
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

        <!-- Activado pero el indexado no va a ocurrir: decirlo, no dejar un spinner -->
        <div
          v-if="indexBlocked === 'plan'"
          class="bg-amber-50 border border-amber-200 rounded-lg p-4"
        >
          <div class="flex items-start gap-2">
            <i class="pi pi-lock text-amber-500 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-amber-800">Tu plan no incluye el Asistente IA</p>
              <p class="text-sm text-amber-700 mt-1">
                La integración está activada, pero tu plan actual no permite indexar el
                catálogo, así que el widget no se va a mostrar en tu tienda. Cambia de plan
                para usarlo.
              </p>
            </div>
          </div>
        </div>

        <div
          v-else-if="indexBlocked === 'empty'"
          class="bg-amber-50 border border-amber-200 rounded-lg p-4"
        >
          <div class="flex items-start gap-2">
            <i class="pi pi-inbox text-amber-500 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-amber-800">No hay productos para indexar</p>
              <p class="text-sm text-amber-700 mt-1">
                No encontramos productos publicados en tu catálogo. El asistente necesita
                productos para poder recomendarlos: publica al menos uno y el widget
                aparecerá solo en tu tienda.
              </p>
            </div>
          </div>
        </div>

        <!-- Indexando: el widget todavía no se ve en la tienda -->
        <div
          v-else-if="isIndexing"
          class="bg-amber-50 border border-amber-200 rounded-lg p-4"
        >
          <div class="flex items-start gap-2">
            <i class="pi pi-spinner pi-spin text-amber-500 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-amber-800">Indexando productos</p>
              <p class="text-sm text-amber-700 mt-1">
                Estamos preparando tu catálogo para el asistente. El widget aparecerá en tu
                tienda online en cuanto termine — no hace falta que hagas nada. Puedes cerrar
                esta pantalla; el proceso sigue en segundo plano.
              </p>
            </div>
          </div>
        </div>

        <!-- Frontend-only info banner -->
        <div
          v-else-if="isFrontendOnly"
          class="bg-primary/5 border border-primary/20 rounded-lg p-4"
        >
          <div class="flex items-start gap-2">
            <i class="pi pi-info-circle text-primary/80 mt-0.5" />
            <p v-if="hasCredentialFields" class="text-sm text-primary">
              Este widget se carga automáticamente en tu tienda online cuando está activado.
              Para verificar que funciona, visita tu tienda después de guardar la configuración.
            </p>
            <p v-else-if="isIndexed" class="text-sm text-primary">
              Tu catálogo está indexado{{ indexedProducts ? ` (${indexedProducts} productos)` : '' }}
              y el widget se carga en tu tienda online. Se actualiza solo cuando editas tus
              productos.
            </p>
            <p v-else class="text-sm text-primary">
              Este widget no necesita configuración: se carga automáticamente en tu tienda
              online cuando está activado. Usa el botón
              <strong>{{ isEnabled ? 'Pausar' : 'Activar' }}</strong> de arriba y visita tu
              tienda para verificar que funciona.
            </p>
          </div>
        </div>

        <!-- Credentials Form -->
        <div v-if="hasCredentialFields" class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-700 mb-4">Credenciales</h3>
          <div class="space-y-4">
            <div v-for="field in provider.config_fields" :key="field.key">
              <label class="block text-sm font-medium text-secondary-700 mb-1">
                {{ field.label }}
                <span v-if="isFieldRequired(field)" class="text-red-500">*</span>
                <span
                  v-else-if="field.required_on_create_only"
                  class="text-xs font-normal text-gray-400"
                >(opcional)</span>
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
              <Dropdown
                v-else-if="field.type === 'select' && field.options"
                v-model="formCredentials[field.key]"
                :options="normalizeOptions(field.options)"
                optionLabel="label"
                optionValue="value"
                :placeholder="field.placeholder || 'Seleccionar...'"
                class="w-full"
              />
              <InputText
                v-else
                v-model="formCredentials[field.key]"
                :placeholder="field.placeholder"
                class="w-full"
              />
              <small
                v-if="field.required_on_create_only && isConfigured"
                class="text-gray-400 mt-1 block"
              >
                Déjalo en blanco para mantener la autorización actual. Solo pega un código nuevo
                si necesitas volver a autorizar la conexión.
              </small>
              <small v-if="field.help" class="text-gray-400 mt-1 block">{{ field.help }}</small>
            </div>
          </div>
        </div>

        <!-- Events Selection (only for providers with server-side events) -->
        <div v-if="hasEvents" class="bg-white rounded-lg shadow p-6">
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
              v-if="hasCredentialFields"
              variant="primary"
              @click="handleSave"
              :loading="store.isSaving"
            >
              <i class="pi pi-save mr-2" />
              {{ isConfigured ? 'Actualizar' : 'Guardar' }}
            </AppButton>
            <AppButton
              v-if="isConfigured && !isFrontendOnly"
              variant="secondary"
              @click="handleTest"
              :loading="store.isTesting"
            >
              <i class="pi pi-bolt mr-2" />
              Probar conexión
            </AppButton>
          </div>
          <AppButton
            v-if="isConfigured && hasCredentialFields"
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

          <template v-if="hasEvents">
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
          </template>
          <template v-else>
            <div class="text-sm text-gray-500 flex items-center gap-2">
              <i class="pi pi-globe text-xs" />
              Widget cargado en la tienda online
            </div>
            <div v-if="needsIndexing && isIndexed" class="text-sm text-gray-500 flex items-center gap-2 mt-2">
              <i class="pi pi-database text-xs text-green-500" />
              <span>
                {{ indexedProducts ?? 0 }} productos indexados
                <span v-if="indexedAtLabel" class="text-gray-400">· {{ indexedAtLabel }}</span>
              </span>
            </div>
          </template>
        </div>

        <!-- Last sync info (only for server-side providers) -->
        <div v-if="isConfigured && !isFrontendOnly" class="bg-white rounded-lg shadow p-6">
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
