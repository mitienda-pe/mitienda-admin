<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useTiktokStore } from '@/stores/tiktok.store'
import { AppButton } from '@/components/ui'
import IdPillsInput from '@/components/ui/IdPillsInput.vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useTiktokStore()
const toast = useToast()

const pixelPattern = /^[A-Z0-9]{10,30}$/i

// Token editing state
const isEditingToken = ref(false)
const newToken = ref('')
const showToken = ref(false)

// Validation
const pixelError = computed(() => {
  const val = store.draftSettings.tienda_tiktok_pixel_id
  if (!val || val.trim() === '') return false
  return val.split(',').some(id => !pixelPattern.test(id.trim()))
})

const hasValidationErrors = computed(() => pixelError.value)

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
  store.updateField('tienda_tiktok_access_token', val)
  isEditingToken.value = false
  newToken.value = ''
  showToken.value = false
}

function removeToken() {
  store.updateField('tienda_tiktok_access_token', null)
  store.updateField('has_access_token' as keyof typeof store.draftSettings, false as never)
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

onMounted(() => {
  store.fetchSettings()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">TikTok</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Configura el Pixel de TikTok y la Events API para rastrear conversiones
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
      <!-- Card 1: TikTok Pixel -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-video text-primary" />
          TikTok Pixel
        </h2>

        <div class="space-y-5">
          <!-- Pixel ID -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Pixel ID
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Tu ID del Pixel de TikTok. Lo encuentras en
              <strong>TikTok Ads Manager &gt; Assets &gt; Events &gt; Web Events</strong>. Puedes
              agregar multiples pixels.
            </p>
            <IdPillsInput
              :model-value="store.draftSettings.tienda_tiktok_pixel_id"
              :pattern="pixelPattern"
              placeholder="Ej: CXXXXXXXXXXXXXXXXX"
              format-hint="El Pixel ID debe ser un codigo alfanumerico de 10-30 caracteres"
              @update:model-value="store.updateField('tienda_tiktok_pixel_id', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Card 2: Events API -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-server text-primary" />
          Events API
        </h2>

        <!-- Intro -->
        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5">
          <h3 class="text-sm font-medium text-blue-800 mb-1">
            ¿Que es la Events API de TikTok?
          </h3>
          <p class="text-xs text-blue-600">
            La Events API envia eventos del servidor directamente a TikTok, complementando el Pixel
            del navegador. Esto mejora la precision de las conversiones reportadas, especialmente
            cuando los usuarios tienen bloqueadores de anuncios.
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
                v-if="store.draftSettings.has_access_token"
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
                >TikTok Ads Manager &gt; Assets &gt; Events &gt; Tu Pixel &gt; Settings &gt;
                Generate Access Token</strong
              >.
            </p>

            <!-- Token display: has existing token and not editing -->
            <div
              v-if="store.savedSettings.has_access_token && !isEditingToken"
              class="flex items-center gap-2"
            >
              <code
                class="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-500 truncate border border-gray-200"
              >
                {{ store.savedSettings.tienda_tiktok_access_token }}
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
              <p
                v-if="!isEditingToken && !store.savedSettings.has_access_token"
                class="text-xs text-gray-400 mt-1"
              >
                El token se guardara al hacer clic en "Guardar configuracion".
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Setup Guide -->
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
                Ve a TikTok Ads Manager &gt; Assets &gt; Events &gt; Manage &gt; Set Up Web Events
                &gt; TikTok Pixel.
              </p>
              <a
                href="https://ads.tiktok.com/i18n/events_manager"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <i class="pi pi-external-link text-xs" />
                Abrir TikTok Events Manager
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
              <h3 class="text-sm font-medium text-secondary-700">Copiar el Pixel ID</h3>
              <p class="text-xs text-gray-400 mt-0.5">
                En tu Pixel creado, copia el Pixel ID (codigo alfanumerico) y pegalo en el campo de
                arriba.
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
              <h3 class="text-sm font-medium text-secondary-700">Configurar Events API</h3>
              <p class="text-xs text-gray-400 mt-0.5">
                En tu Pixel &gt; Settings &gt; Events API &gt; Generate Access Token. Copia el token
                y pegalo en la seccion de arriba.
              </p>
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
                Usa la herramienta <strong>Test Events</strong> en TikTok Events Manager para
                verificar que los eventos se estan recibiendo correctamente.
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
