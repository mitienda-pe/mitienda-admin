<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useFacebookStore } from '@/stores/facebook.store'
import { AppButton } from '@/components/ui'
import IdPillsInput from '@/components/ui/IdPillsInput.vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useFacebookStore()
const toast = useToast()

const pixelPattern = /^\d{10,20}$/
const testEventPattern = /^TEST\d+$/i

// Token editing state
const isEditingToken = ref(false)
const newToken = ref('')
const showToken = ref(false)

// Validation
const pixelError = computed(() => {
  const val = store.draftSettings.tienda_identificadorpixel
  if (!val || val.trim() === '') return false
  return val.split(',').some(id => !pixelPattern.test(id.trim()))
})

const testEventError = computed(() => {
  const val = store.draftSettings.tienda_fb_test_event_code
  if (!val || val.trim() === '') return false
  return !testEventPattern.test(val.trim())
})

const hasValidationErrors = computed(() => pixelError.value || testEventError.value)

function startEditToken() {
  isEditingToken.value = true
  newToken.value = ''
  showToken.value = false
}

function cancelEditToken() {
  isEditingToken.value = false
  newToken.value = ''
  showToken.value = false
}

function applyToken() {
  const val = newToken.value.trim()
  if (!val) return
  store.updateField('tienda_fb_capi_token', val)
  isEditingToken.value = false
  newToken.value = ''
  showToken.value = false
}

function removeToken() {
  store.updateField('tienda_fb_capi_token', null)
  store.updateField('has_capi_token' as keyof typeof store.draftSettings, false as never)
}

async function save() {
  if (hasValidationErrors.value) {
    toast.add({
      severity: 'warn',
      summary: 'Revisa los campos',
      detail: 'Hay errores de formato en los campos',
      life: 4000
    })
    return
  }
  const ok = await store.saveSettings()
  if (ok) {
    isEditingToken.value = false
    newToken.value = ''
    toast.add({ severity: 'success', summary: 'Configuracion guardada', life: 3000 })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo guardar',
      life: 5000
    })
  }
}

function copyToClipboard(url: string) {
  navigator.clipboard.writeText(url)
  toast.add({ severity: 'info', summary: 'URL copiada al portapapeles', life: 2000 })
}

onMounted(() => {
  store.fetchSettings()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Facebook</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Configura el Pixel de Facebook, Conversions API y el catalogo de productos
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error && !store.draftSettings.store_url"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2" />
      <p class="text-red-600">{{ store.error }}</p>
      <AppButton variant="outlined" class="mt-4" @click="store.fetchSettings()">
        Reintentar
      </AppButton>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Card 1: Facebook Pixel -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-facebook text-primary" />
          Facebook Pixel
        </h2>

        <div class="space-y-5">
          <!-- Pixel ID -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Pixel ID
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Tu ID del Pixel de Facebook. Lo encuentras en
              <strong>Meta Events Manager &gt; Origenes de datos &gt; Pixel</strong>. Puedes agregar
              multiples pixels.
            </p>
            <IdPillsInput
              :model-value="store.draftSettings.tienda_identificadorpixel"
              :pattern="pixelPattern"
              placeholder="Ej: 1234567890123456"
              format-hint="El Pixel ID debe ser un numero de 10-20 digitos"
              @update:model-value="store.updateField('tienda_identificadorpixel', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Card 2: Conversions API -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-server text-primary" />
          Conversions API (CAPI)
        </h2>

        <!-- Intro -->
        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5">
          <h3 class="text-sm font-medium text-blue-800 mb-1">
            ¿Que es la Conversions API?
          </h3>
          <p class="text-xs text-blue-600">
            La Conversions API envia eventos del servidor directamente a Meta, complementando el
            Pixel del navegador. Esto mejora la precision del seguimiento, especialmente con
            bloqueadores de anuncios y restricciones de cookies.
          </p>
        </div>

        <div class="space-y-5">
          <!-- Access Token -->
          <div>
            <div class="flex items-center gap-2 mb-1">
              <label class="text-sm font-medium text-secondary-700">
                Token de acceso
              </label>
              <span
                v-if="store.draftSettings.has_capi_token"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
              >
                Configurado
              </span>
              <span
                v-else
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
              >
                No configurado
              </span>
            </div>
            <p class="text-xs text-gray-400 mb-2">
              Genera el token en
              <strong
                >Meta Events Manager &gt; Configuracion del Pixel &gt; Conversions API &gt; Generar
                token de acceso</strong
              >.
            </p>

            <!-- Token display: has existing token and not editing -->
            <div
              v-if="store.savedSettings.has_capi_token && !isEditingToken"
              class="flex items-center gap-2"
            >
              <code
                class="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-500 truncate border border-gray-200"
              >
                {{ store.savedSettings.tienda_fb_capi_token }}
              </code>
              <AppButton variant="outlined" size="small" @click="startEditToken">
                Cambiar
              </AppButton>
              <AppButton variant="text" size="small" class="text-red-600" @click="removeToken">
                Eliminar
              </AppButton>
            </div>

            <!-- Token input: editing or no token yet -->
            <div v-else>
              <div class="relative">
                <input
                  v-model="newToken"
                  :type="showToken ? 'text' : 'password'"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Pega tu token de acceso aqui"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  @click="showToken = !showToken"
                >
                  <i :class="showToken ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                </button>
              </div>
              <div v-if="isEditingToken" class="flex gap-2 mt-2">
                <AppButton variant="outlined" size="small" @click="applyToken">
                  Aplicar
                </AppButton>
                <AppButton variant="text" size="small" @click="cancelEditToken">
                  Cancelar
                </AppButton>
              </div>
              <p v-if="!isEditingToken && !store.savedSettings.has_capi_token" class="text-xs text-gray-400 mt-1">
                El token se guardara al hacer clic en "Guardar configuracion".
              </p>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Test Event Code -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Codigo de evento de prueba
              <span class="text-gray-400 font-normal">(opcional)</span>
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Solo para pruebas. Encuentra este codigo en
              <strong>Meta Events Manager &gt; Eventos de prueba</strong>. Dejalo vacio en
              produccion.
            </p>
            <input
              type="text"
              :value="store.draftSettings.tienda_fb_test_event_code || ''"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              :class="testEventError ? 'border-red-300' : 'border-gray-300'"
              placeholder="TEST12345"
              @input="
                store.updateField(
                  'tienda_fb_test_event_code',
                  ($event.target as HTMLInputElement).value || null
                )
              "
            />
            <p v-if="testEventError" class="text-xs text-red-500 mt-1">
              <i class="pi pi-exclamation-circle mr-1" />Formato no valido. Usa TEST seguido de
              numeros (ej: TEST12345)
            </p>
          </div>
        </div>
      </div>

      <!-- Card 3: Product Catalog -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-shopping-bag text-primary" />
          Catalogo de productos
        </h2>

        <div class="space-y-5">
          <!-- Feed CSV -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Feed de productos (CSV)
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Usa esta URL en Facebook Commerce Manager para sincronizar tu catalogo de productos. Se
              actualiza automaticamente.
            </p>
            <div class="flex items-center gap-2">
              <code
                class="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600 truncate border border-gray-200"
              >
                {{ store.draftSettings.feed_csv_url }}
              </code>
              <button
                class="shrink-0 p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                title="Copiar URL"
                @click="copyToClipboard(store.draftSettings.feed_csv_url)"
              >
                <i class="pi pi-copy" />
              </button>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Feed XML -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Feed de productos (XML)
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Formato alternativo en XML (Atom). Usa este si el formato CSV no funciona correctamente.
            </p>
            <div class="flex items-center gap-2">
              <code
                class="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600 truncate border border-gray-200"
              >
                {{ store.draftSettings.feed_xml_url }}
              </code>
              <button
                class="shrink-0 p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                title="Copiar URL"
                @click="copyToClipboard(store.draftSettings.feed_xml_url)"
              >
                <i class="pi pi-copy" />
              </button>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Link to Commerce Manager -->
          <a
            href="https://business.facebook.com/commerce"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <i class="pi pi-external-link text-xs" />
            Ir a Facebook Commerce Manager
          </a>
        </div>
      </div>

      <!-- Card 4: Setup Guide -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-question-circle text-primary" />
          Guia de configuracion
        </h2>

        <div class="space-y-4">
          <!-- Step 1 -->
          <div class="flex gap-3">
            <div
              class="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold"
            >
              1
            </div>
            <div>
              <h3 class="text-sm font-medium text-secondary-700">Crear un Pixel</h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Ve a Meta Events Manager &gt; Conectar origenes de datos &gt; Web &gt; Facebook
                Pixel.
              </p>
              <a
                href="https://business.facebook.com/events_manager2"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <i class="pi pi-external-link text-xs" />
                Abrir Meta Events Manager
              </a>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex gap-3">
            <div
              class="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold"
            >
              2
            </div>
            <div>
              <h3 class="text-sm font-medium text-secondary-700">Configurar Conversions API</h3>
              <p class="text-xs text-gray-400 mt-0.5">
                En tu Pixel &gt; Configuracion &gt; Conversions API &gt; Configurar manualmente.
                Genera un token de acceso y pegalo en la seccion de arriba.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex gap-3">
            <div
              class="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold"
            >
              3
            </div>
            <div>
              <h3 class="text-sm font-medium text-secondary-700">
                Configurar catalogo de productos
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Ve a Commerce Manager &gt; Catalogos &gt; Agregar productos &gt; Fuente de datos.
                Pega la URL del feed CSV que aparece arriba.
              </p>
              <a
                href="https://business.facebook.com/commerce"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <i class="pi pi-external-link text-xs" />
                Abrir Commerce Manager
              </a>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="flex gap-3">
            <div
              class="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold"
            >
              4
            </div>
            <div>
              <h3 class="text-sm font-medium text-secondary-700">Verificar la integracion</h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Usa la extension
                <strong>Facebook Pixel Helper</strong> de Chrome para verificar que el Pixel esta
                funcionando. Para CAPI, usa
                <strong>Eventos de prueba</strong> en Events Manager.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div class="flex items-center gap-3 pb-8">
        <AppButton
          variant="primary"
          :loading="store.isSaving"
          :disabled="!store.hasChanges || hasValidationErrors"
          @click="save"
        >
          <i class="pi pi-check mr-2" />
          Guardar configuracion
        </AppButton>
        <span v-if="store.hasChanges" class="text-xs text-amber-600">
          Tienes cambios sin guardar
        </span>
      </div>
    </div>
  </div>
</template>
