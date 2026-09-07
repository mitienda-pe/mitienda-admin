<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSeoStore } from '@/stores/seo.store'
import { AppButton, AppInput, UnsavedChangesBar } from '@/components/ui'
import IdPillsInput from '@/components/ui/IdPillsInput.vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useSeoStore()
const toast = useToast()

const analyticsPattern = /^(G-[A-Z0-9]+|UA-\d+-\d+)$/i
const gtmPattern = /^GTM-[A-Z0-9]+$/i
const adsIdPattern = /^AW-\d{6,15}$/i
const adsLabelPattern = /^[A-Za-z0-9_-]{5,50}$/

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

const adsId = computed(() => (store.draftSettings.tienda_google_ads_id || '').trim())
const adsLabel = computed(() => (store.draftSettings.tienda_google_ads_label_compra || '').trim())

const adsIdError = computed(() => {
  if (adsId.value === '') return ''
  return adsIdPattern.test(adsId.value) ? '' : 'Formato no válido. Usa AW-XXXXXXXXX'
})

const adsLabelError = computed(() => {
  if (adsLabel.value === '') return ''
  if (!adsLabelPattern.test(adsLabel.value)) {
    return 'Es el texto que sigue a la barra, por ejemplo AbC-D_efG-h12_34-567'
  }
  return adsId.value === '' ? 'Falta el ID de conversión de Google Ads' : ''
})

// Un ID sin etiqueta no es un error —el remarketing igual funciona— pero sí una
// configuración que parece completa y no registra ni una venta. Se avisa.
const adsMissingLabel = computed(() => adsId.value !== '' && adsLabel.value === '' && !adsIdError.value)

const hasContainer = computed(() => (store.draftSettings.tienda_google_tagmanager || '').trim() !== '')

// Mismo riesgo que con Ads, un piso más arriba: medir la misma propiedad de GA4
// por los dos caminos —el nuestro y un tag adentro del contenedor— la cuenta dos
// veces.
const analyticsDuplicateWarning = computed(() => {
  const ga = (store.draftSettings.tienda_codigo_google_analytics || '').trim()
  return ga !== '' && hasContainer.value
})

// La trampa clásica: el contenedor de GTM casi siempre ya trae su propia
// etiqueta de conversión, puesta por la agencia. Configurar Ads también acá
// manda la misma venta dos veces y Google la reporta como transacción duplicada.
const adsDuplicateWarning = computed(() => hasContainer.value && adsId.value !== '')

const hasValidationErrors = computed(
  () => analyticsError.value || gtmError.value || !!adsIdError.value || !!adsLabelError.value
)

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

          <div
            v-if="hasContainer"
            class="flex gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600"
          >
            <i class="pi pi-check-circle mt-0.5 text-primary" />
            <span>
              Tu tienda publica los eventos de ecommerce de GA4 en la capa de datos, con la
              estructura estándar: <strong>view_item</strong>, <strong>add_to_cart</strong>,
              <strong>begin_checkout</strong>, <strong>purchase</strong> y
              <strong>add_to_wishlist</strong>, cada uno con su monto y sus productos. Quien
              administre el contenedor solo tiene que crear los disparadores de evento
              personalizado con esos nombres. Si hoy dispara la conversión por la URL de la página
              de confirmación, conviene reemplazarlo: esa forma no trae el monto y se repite si el
              comprador recarga.
            </span>
          </div>

          <div
            v-if="analyticsDuplicateWarning"
            class="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
          >
            <i class="pi pi-exclamation-triangle mt-0.5" />
            <span>
              Tienes Analytics y Tag Manager configurados a la vez. Si dentro del contenedor
              también hay un tag de GA4 para esta misma propiedad, cada evento se va a contar
              <strong>dos veces</strong>. Deja la medición de GA4 en un solo lugar: acá o en el
              contenedor.
            </span>
          </div>
        </div>
      </div>

      <!-- Card 2: Google Ads -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-megaphone text-primary" />
          Google Ads
        </h2>

        <p class="text-xs text-gray-400 mb-5">
          Va aparte de Analytics: son cuentas distintas y miden cosas distintas. Con esto
          configurado, cada compra de tu tienda se registra como conversión en Google Ads.
        </p>

        <div class="space-y-5">
          <!-- ID de conversión -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              ID de conversión
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Lo encuentras en <strong>Google Ads &gt; Objetivos &gt; Conversiones &gt;
              Configuración de etiqueta</strong>. Empieza con <strong>AW-</strong>.
            </p>
            <AppInput
              :model-value="store.draftSettings.tienda_google_ads_id ?? ''"
              placeholder="AW-XXXXXXXXX"
              :error="adsIdError"
              @update:model-value="store.updateField('tienda_google_ads_id', $event)"
            />
          </div>

          <!-- Etiqueta de conversión de compra -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Etiqueta de la conversión de compra
            </label>
            <p class="text-xs text-gray-400 mb-2">
              En la misma pantalla, es el texto que va después de la barra en
              <strong>send_to</strong>. Sin esta etiqueta se instala el remarketing pero
              <strong>no se registra ninguna venta</strong>.
            </p>
            <AppInput
              :model-value="store.draftSettings.tienda_google_ads_label_compra ?? ''"
              placeholder="AbC-D_efG-h12_34-567"
              :error="adsLabelError"
              @update:model-value="store.updateField('tienda_google_ads_label_compra', $event)"
            />
          </div>

          <div
            v-if="adsMissingLabel"
            class="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
          >
            <i class="pi pi-info-circle mt-0.5" />
            <span>
              Con el ID pero sin etiqueta, Google Ads arma audiencias de remarketing pero no va a
              contar ninguna venta. Agrega la etiqueta para medir conversiones.
            </span>
          </div>

          <div
            v-if="adsDuplicateWarning"
            class="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
          >
            <i class="pi pi-exclamation-triangle mt-0.5" />
            <span>
              También tienes un contenedor de Tag Manager. Si adentro ya hay una etiqueta de
              conversión de Google Ads, la venta se va a contar <strong>dos veces</strong> y Google
              la va a reportar como transacción duplicada. Deja la conversión en un solo lugar:
              acá o en el contenedor.
            </span>
          </div>
        </div>
      </div>

      <!-- Card 3: Google Search Console & Feeds -->
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
