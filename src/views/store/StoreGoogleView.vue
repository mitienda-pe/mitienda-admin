<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSeoStore } from '@/stores/seo.store'
import { AppButton, UnsavedChangesBar } from '@/components/ui'
import IdPillsInput from '@/components/ui/IdPillsInput.vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useSeoStore()
const toast = useToast()

const analyticsPattern = /^(G-[A-Z0-9]+|UA-\d+-\d+)$/i
const gtmPattern = /^GTM-[A-Z0-9]+$/i

const analyticsError = computed(() => {
  const val = store.draftSettings.tienda_codigo_google_analytics
  if (!val || val.trim() === '') return false
  return val.split(',').some(id => !analyticsPattern.test(id.trim()))
})

const gtmError = computed(() => {
  const val = store.draftSettings.tienda_google_tagmanager
  if (!val || val.trim() === '') return false
  return val.split(',').some(id => !gtmPattern.test(id.trim()))
})

const hasValidationErrors = computed(() => analyticsError.value || gtmError.value)

async function save() {
  if (hasValidationErrors.value) {
    toast.add({
      severity: 'warn',
      summary: 'Revisa los campos',
      detail: 'Hay errores de formato en los campos de Google',
      life: 4000
    })
    return
  }
  const ok = await store.saveSettings()
  if (ok) {
    toast.add({ severity: 'success', summary: 'Configuración guardada', life: 3000 })
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
        <h1 class="text-3xl font-bold text-secondary">Google</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Configura Google Analytics, Tag Manager, Search Console y Merchant Center
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
      <!-- Card 1: Google Analytics & Tag Manager -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-chart-bar text-primary" />
          Google Analytics y Tag Manager
        </h2>

        <div class="space-y-5">
          <!-- Google Analytics -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              ID de Google Analytics
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Tu ID de medición de Google Analytics 4 (GA4). Lo encuentras en
              <strong>Administrador &gt; Flujos de datos &gt; Tu flujo web</strong>. Si usas
              Universal Analytics, también acepta el formato UA. Puedes agregar varios IDs.
            </p>
            <IdPillsInput
              :model-value="store.draftSettings.tienda_codigo_google_analytics"
              :pattern="analyticsPattern"
              placeholder="G-XXXXXXXXXX"
              format-hint="Formato no válido. Usa G-XXXXXXXXXX o UA-XXXXXXXX-X"
              @update:model-value="store.updateField('tienda_codigo_google_analytics', $event)"
            />
          </div>

          <hr class="border-gray-100" />

          <!-- Google Tag Manager -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              ID de Google Tag Manager
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Tu ID de contenedor de GTM. Lo encuentras en
              <strong>tagmanager.google.com</strong> al seleccionar tu contenedor. GTM te permite
              gestionar todos tus tags de seguimiento desde un solo lugar. Puedes agregar varios IDs.
            </p>
            <IdPillsInput
              :model-value="store.draftSettings.tienda_google_tagmanager"
              :pattern="gtmPattern"
              placeholder="GTM-XXXXXXX"
              format-hint="Formato no válido. Usa GTM-XXXXXXX"
              @update:model-value="store.updateField('tienda_google_tagmanager', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Card 2: Google Search Console & Feeds -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-search text-primary" />
          Google Search Console y Feeds
        </h2>

        <div class="space-y-5">
          <!-- Site Verification -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Etiqueta de verificación
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Pega aquí el valor del atributo <code class="bg-gray-100 px-1 rounded">content</code>
              de la meta etiqueta de verificación de Google Search Console. Lo encuentras en
              <strong>Search Console &gt; Verificar propiedad &gt; Método de etiqueta HTML</strong>.
            </p>
            <input
              type="text"
              :value="store.draftSettings.tienda_tag_google_site_verification || ''"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ej: 50c0bu9KxMLZhH1IS5iaijX0u4IuORJS2Rbg_WPfBjA"
              @input="
                store.updateField(
                  'tienda_tag_google_site_verification',
                  ($event.target as HTMLInputElement).value || null
                )
              "
            />
          </div>

          <hr class="border-gray-100" />

          <!-- Sitemap URL -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1"> Sitemap </label>
            <p class="text-xs text-gray-400 mb-2">
              URL de tu archivo sitemap.xml. Envíalo a Google Search Console para mejorar la
              indexación de tu tienda.
            </p>
            <div class="flex items-center gap-2">
              <code
                class="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600 truncate border border-gray-200"
              >
                {{ store.draftSettings.sitemap_url }}
              </code>
              <button
                class="shrink-0 p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                title="Copiar URL"
                @click="copyToClipboard(store.draftSettings.sitemap_url)"
              >
                <i class="pi pi-copy" />
              </button>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Product Feed URL -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Feed de productos (Google Merchant Center)
            </label>
            <p class="text-xs text-gray-400 mb-2">
              URL del feed de productos para Google Merchant Center. Usa esta URL para sincronizar
              tu catálogo con Google Shopping y mostrar tus productos en los resultados de Google.
            </p>
            <div class="flex items-center gap-2">
              <code
                class="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600 truncate border border-gray-200"
              >
                {{ store.draftSettings.product_feed_url }}
              </code>
              <button
                class="shrink-0 p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                title="Copiar URL"
                @click="copyToClipboard(store.draftSettings.product_feed_url)"
              >
                <i class="pi pi-copy" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <UnsavedChangesBar
      :dirty="store.hasChanges"
      :save-disabled="hasValidationErrors"
      :loading="store.isSaving"
      save-label="Guardar configuración"
      @save="save"
    />
  </div>
</template>
